// /api/quote.js
// Энэ нь Vercel Serverless Function — Finnhub API key-г client-д харагдахгүйгээр
// server талд нууж, зөвхөн шаардлагатай үнийн мэдээллийг буцаана.
//
// Дуудах жишээ: /api/quote?symbol=AAPL

module.exports = async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "symbol параметр дутуу байна" });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server дээр API key тохируулаагүй байна" });
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const finnhubRes = await fetch(url);

    if (!finnhubRes.ok) {
      return res.status(finnhubRes.status).json({ error: "Finnhub-с мэдээлэл татахад алдаа гарлаа" });
    }

    const data = await finnhubRes.json();

    // Хэрэв ticker буруу бол Finnhub бүх талбарыг 0-ээр буцаадаг
    if (!data || data.c === 0) {
      return res.status(404).json({ error: "Энэ ticker-ийн мэдээлэл олдсонгүй" });
    }

    // Хэрэглэгчид зөвхөн хэрэгтэй талбаруудыг л буцаана
    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      current: data.c,       // одоогийн үнэ
      change: data.d,        // өөрчлөлт (доллар)
      percent: data.dp,      // өөрчлөлт (хувь)
      high: data.h,          // өдрийн дээд
      low: data.l,           // өдрийн доод
      open: data.o,          // нээлтийн үнэ
      prevClose: data.pc,    // өмнөх хаалтын үнэ
    });
  } catch (e) {
    return res.status(500).json({ error: "Тодорхойгүй алдаа гарлаа" });
  }
}
