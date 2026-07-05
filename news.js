// /api/news.js
// Дуудах жишээ: /api/news?symbol=AAPL&type=stock  эсвэл  /api/news?symbol=BTC&type=crypto&name=bitcoin
//
// Стек:
//  - Хувьцааны мэдээ: Finnhub /company-news (тухайн ticker-д зориулсан)
//  - Криптогийн мэдээ: Finnhub /news?category=crypto (ЕРӨНХИЙ мэдээ, coin нэрээр шүүнэ —
//    CryptoCompare-ийн үнэгүй endpoint 2026.06-с хойш key шаардах болсон тул сольсон)
//  - Орчуулга: MyMemory Translate API (key шаардахгүй, үнэгүй, өдөрт хязгаартай)

async function translateToMongolian(text) {
  if (!text) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|mn`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch (e) {
    return text; // орчуулга амжилтгүй бол эх текстээ буцаана
  }
}

module.exports = async function handler(req, res) {
  const { symbol, type, lang, name } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: "symbol параметр дутуу байна" });
  }

  // Мэдээ ойролцоогоор минут тутамд л шинэчлэгддэг тул 5 минутын кэш хэвийн —
  // ижил ticker дээр олон хэрэглэгч зэрэг ирвэл Finnhub рүү нэг л удаа очно.
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=120");

  try {
    let rawItems = [];
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server дээр API key тохируулаагүй байна" });
    }

    if (type === "crypto") {
      // ⚠️ CryptoCompare-ийн үнэгүй news endpoint 2026.06-с хойш key шаардах болсон тул
      // үүний оронд аль хэдийн байгаа Finnhub key-гээ ашиглаж ерөнхий крипто мэдээг татна,
      // дараа нь тухайн coin-ы нэр/ticker-тэй хамааралтайг нь шүүнэ.
      const url = `https://finnhub.io/api/v1/news?category=crypto&token=${apiKey}`;
      const fh = await fetch(url);
      const allNews = fh.ok ? await fh.json() : [];
      const hints = [symbol.toLowerCase(), (name || "").toLowerCase()].filter(Boolean);
      const relevant = (Array.isArray(allNews) ? allNews : []).filter(n => {
        const text = `${n.headline || ""} ${n.summary || ""}`.toLowerCase();
        return hints.some(h => h && text.includes(h));
      });
      const chosen = relevant.length ? relevant : (Array.isArray(allNews) ? allNews : []);
      rawItems = chosen.slice(0, 3).map(n => ({
        headline: n.headline,
        summary: (n.summary || "").slice(0, 180),
        url: n.url,
      }));
    } else {
      const to = new Date();
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fmt = (d) => d.toISOString().split("T")[0];
      const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}&token=${apiKey}`;
      const fh = await fetch(url);
      const fhData = await fh.json();
      rawItems = (Array.isArray(fhData) ? fhData : []).slice(0, 3).map(n => ({
        headline: n.headline,
        summary: (n.summary || "").slice(0, 180),
        url: n.url,
      }));
    }

    if (!rawItems.length) {
      return res.status(200).json({ items: [] });
    }

    // Хэрэглэгч Англи хэл сонгосон бол орчуулгын алхмыг алгасаж, эх текстийг шууд буцаана
    // (энэ нь MyMemory API-ийн өдрийн хязгаарыг ч хамгаална).
    if (lang === "en") {
      return res.status(200).json({ items: rawItems });
    }

    // Гарчиг + тайлбарыг зэрэгцүүлж орчуулна (нэг мэдээнд 1 удаагийн дуудлага)
    const translated = await Promise.all(
      rawItems.map(async (item) => {
        const combined = `${item.headline}\n${item.summary}`;
        const translatedCombined = await translateToMongolian(combined);
        const [tHeadline, ...rest] = translatedCombined.split("\n");
        return {
          headline: tHeadline || item.headline,
          summary: rest.join("\n") || item.summary,
          url: item.url,
        };
      })
    );

    return res.status(200).json({ items: translated });
  } catch (e) {
    return res.status(500).json({ error: "Мэдээ татахад алдаа гарлаа" });
  }
};
