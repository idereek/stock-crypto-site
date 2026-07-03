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

    if (!data || data.c === 0) {
      return res.status(404).json({ error: "Энэ ticker-ийн мэдээлэл олдсонгүй" });
    }

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      current: data.c,
      change: data.d,
      percent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      prevClose: data.pc,
    });
  } catch (e) {
    return res.status(500).json({ error: "Тодорхойгүй алдаа гарлаа" });
  }
}
