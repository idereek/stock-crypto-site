// /api/news.js
// Дуудах жишээ: /api/news?symbol=AAPL&type=stock  эсвэл  /api/news?symbol=BTC&type=crypto
//
// Стек:
//  - Хувьцааны мэдээ: Finnhub /company-news (аль хэдийн байгаа FINNHUB_API_KEY ашиглана)
//  - Криптогийн мэдээ: CryptoCompare /data/v2/news (key шаардахгүй, үнэгүй)
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
  const { symbol, type, lang } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: "symbol параметр дутуу байна" });
  }

  // Мэдээ ойролцоогоор минут тутамд л шинэчлэгддэг тул 5 минутын кэш хэвийн —
  // ижил ticker дээр олон хэрэглэгч зэрэг ирвэл Finnhub/CryptoCompare рүү нэг л удаа очно.
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=120");

  try {
    let rawItems = [];

    if (type === "crypto") {
      const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${encodeURIComponent(symbol)}`;
      const cc = await fetch(url);
      const ccData = await cc.json();
      rawItems = (ccData?.Data || []).slice(0, 3).map(n => ({
        headline: n.title,
        summary: (n.body || "").slice(0, 180),
        url: n.url,
      }));
    } else {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server дээр API key тохируулаагүй байна" });
      }
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
