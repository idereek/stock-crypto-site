// Ticker / нэрийн толь бичиг — хайлтыг Монгол болон Англи хэлээр аль алинаар нь дэмжинэ.
// type: "crypto" -> CoinGecko id ашиглана (key шаардлагагүй)
//       "stock"  -> одоогоор demo өгөгдөл, Finnhub key нэмэхэд амьд болно

const ASSET_DB = [
  { ticker: "BTC", type: "crypto", coingeckoId: "bitcoin",  names: ["bitcoin", "биткойн", "битков"] },
  { ticker: "ETH", type: "crypto", coingeckoId: "ethereum", names: ["ethereum", "этериум", "эфир"] },
  { ticker: "SOL", type: "crypto", coingeckoId: "solana",   names: ["solana", "солана"] },
  { ticker: "BNB", type: "crypto", coingeckoId: "binancecoin", names: ["binance coin", "бинанс"] },
  { ticker: "XRP", type: "crypto", coingeckoId: "ripple",   names: ["ripple", "рипл"] },
  { ticker: "DOGE", type: "crypto", coingeckoId: "dogecoin", names: ["dogecoin", "дожкойн"] },

  { ticker: "AAPL", type: "stock", names: ["apple", "аппл", "эппл"], demoPrice: 214.32, demoChange: 1.24 },
  { ticker: "TSLA", type: "stock", names: ["tesla", "тесла"], demoPrice: 331.10, demoChange: -2.87 },
  { ticker: "GOOGL", type: "stock", names: ["google", "гүүгл", "alphabet"], demoPrice: 178.55, demoChange: 0.62 },
  { ticker: "AMZN", type: "stock", names: ["amazon", "амазон"], demoPrice: 201.77, demoChange: 0.15 },
  { ticker: "MSFT", type: "stock", names: ["microsoft", "майкрософт"], demoPrice: 465.20, demoChange: -0.41 },
  { ticker: "NVDA", type: "stock", names: ["nvidia", "нвидиа"], demoPrice: 152.40, demoChange: 3.02 },
];

function findAsset(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ASSET_DB.filter(a =>
    a.ticker.toLowerCase().includes(q) ||
    a.names.some(n => n.toLowerCase().includes(q))
  );
}
