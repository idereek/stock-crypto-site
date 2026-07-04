// Ticker / нэрийн толь бичиг — хайлтыг Монгол болон Англи хэлээр аль алинаар нь дэмжинэ.
// type: "crypto" -> CoinGecko id (key шаардлагагүй) + TradingView chart симбол
//       "stock"  -> Finnhub-с /api/quote дамжуулан live + TradingView chart симбол

const ASSET_DB = [
  // ---------- Крипто ----------
  { ticker: "BTC", type: "crypto", coingeckoId: "bitcoin", tv: "BINANCE:BTCUSDT", names: ["bitcoin", "биткойн"] },
  { ticker: "ETH", type: "crypto", coingeckoId: "ethereum", tv: "BINANCE:ETHUSDT", names: ["ethereum", "этериум", "эфир"] },
  { ticker: "USDT", type: "crypto", coingeckoId: "tether", tv: null, names: ["tether", "тезер"] },
  { ticker: "BNB", type: "crypto", coingeckoId: "binancecoin", tv: "BINANCE:BNBUSDT", names: ["binance coin", "бинанс"] },
  { ticker: "SOL", type: "crypto", coingeckoId: "solana", tv: "BINANCE:SOLUSDT", names: ["solana", "солана"] },
  { ticker: "USDC", type: "crypto", coingeckoId: "usd-coin", tv: null, names: ["usd coin"] },
  { ticker: "XRP", type: "crypto", coingeckoId: "ripple", tv: "BINANCE:XRPUSDT", names: ["ripple", "рипл"] },
  { ticker: "ADA", type: "crypto", coingeckoId: "cardano", tv: "BINANCE:ADAUSDT", names: ["cardano", "кардано"] },
  { ticker: "DOGE", type: "crypto", coingeckoId: "dogecoin", tv: "BINANCE:DOGEUSDT", names: ["dogecoin", "дожкойн"] },
  { ticker: "TRX", type: "crypto", coingeckoId: "tron", tv: "BINANCE:TRXUSDT", names: ["tron", "трон"] },
  { ticker: "AVAX", type: "crypto", coingeckoId: "avalanche-2", tv: "BINANCE:AVAXUSDT", names: ["avalanche"] },
  { ticker: "LINK", type: "crypto", coingeckoId: "chainlink", tv: "BINANCE:LINKUSDT", names: ["chainlink", "чэйнлинк"] },
  { ticker: "DOT", type: "crypto", coingeckoId: "polkadot", tv: "BINANCE:DOTUSDT", names: ["polkadot", "полкадот"] },
  { ticker: "MATIC", type: "crypto", coingeckoId: "matic-network", tv: "BINANCE:MATICUSDT", names: ["polygon", "полигон"] },
  { ticker: "LTC", type: "crypto", coingeckoId: "litecoin", tv: "BINANCE:LTCUSDT", names: ["litecoin", "лайткойн"] },
  { ticker: "SHIB", type: "crypto", coingeckoId: "shiba-inu", tv: "BINANCE:SHIBUSDT", names: ["shiba inu", "шиба"] },
  { ticker: "BCH", type: "crypto", coingeckoId: "bitcoin-cash", tv: "BINANCE:BCHUSDT", names: ["bitcoin cash"] },
  { ticker: "UNI", type: "crypto", coingeckoId: "uniswap", tv: "BINANCE:UNIUSDT", names: ["uniswap", "юнисвап"] },
  { ticker: "XLM", type: "crypto", coingeckoId: "stellar", tv: "BINANCE:XLMUSDT", names: ["stellar", "стеллар"] },
  { ticker: "XMR", type: "crypto", coingeckoId: "monero", tv: "KRAKEN:XMRUSD", names: ["monero", "монеро"] },
  { ticker: "APT", type: "crypto", coingeckoId: "aptos", tv: "BINANCE:APTUSDT", names: ["aptos", "аптос"] },
  { ticker: "NEAR", type: "crypto", coingeckoId: "near", tv: "BINANCE:NEARUSDT", names: ["near protocol"] },
  { ticker: "ICP", type: "crypto", coingeckoId: "internet-computer", tv: "BINANCE:ICPUSDT", names: ["internet computer"] },
  { ticker: "ARB", type: "crypto", coingeckoId: "arbitrum", tv: "BINANCE:ARBUSDT", names: ["arbitrum"] },
  { ticker: "OP", type: "crypto", coingeckoId: "optimism", tv: "BINANCE:OPUSDT", names: ["optimism"] },
  { ticker: "ATOM", type: "crypto", coingeckoId: "cosmos", tv: "BINANCE:ATOMUSDT", names: ["cosmos", "космос"] },
  { ticker: "ALGO", type: "crypto", coingeckoId: "algorand", tv: "BINANCE:ALGOUSDT", names: ["algorand"] },
  { ticker: "AAVE", type: "crypto", coingeckoId: "aave", tv: "BINANCE:AAVEUSDT", names: ["aave"] },
  { ticker: "MKR", type: "crypto", coingeckoId: "maker", tv: "BINANCE:MKRUSDT", names: ["maker"] },
  { ticker: "FTM", type: "crypto", coingeckoId: "fantom", tv: "BINANCE:FTMUSDT", names: ["fantom"] },

  // ---------- Хувьцаа (Technology) ----------
  { ticker: "AAPL", type: "stock", tv: "NASDAQ:AAPL", names: ["apple", "аппл", "эппл"] },
  { ticker: "MSFT", type: "stock", tv: "NASDAQ:MSFT", names: ["microsoft", "майкрософт"] },
  { ticker: "GOOGL", type: "stock", tv: "NASDAQ:GOOGL", names: ["google", "гүүгл", "alphabet"] },
  { ticker: "AMZN", type: "stock", tv: "NASDAQ:AMZN", names: ["amazon", "амазон"] },
  { ticker: "META", type: "stock", tv: "NASDAQ:META", names: ["meta", "facebook", "фэйсбүүк"] },
  { ticker: "NVDA", type: "stock", tv: "NASDAQ:NVDA", names: ["nvidia", "нвидиа"] },
  { ticker: "TSLA", type: "stock", tv: "NASDAQ:TSLA", names: ["tesla", "тесла"] },
  { ticker: "NFLX", type: "stock", tv: "NASDAQ:NFLX", names: ["netflix", "нэтфликс"] },
  { ticker: "AMD", type: "stock", tv: "NASDAQ:AMD", names: ["amd"] },
  { ticker: "INTC", type: "stock", tv: "NASDAQ:INTC", names: ["intel", "интел"] },
  { ticker: "ORCL", type: "stock", tv: "NYSE:ORCL", names: ["oracle", "оракл"] },
  { ticker: "CRM", type: "stock", tv: "NYSE:CRM", names: ["salesforce"] },
  { ticker: "ADBE", type: "stock", tv: "NASDAQ:ADBE", names: ["adobe", "адоб"] },
  { ticker: "IBM", type: "stock", tv: "NYSE:IBM", names: ["ibm"] },
  { ticker: "CSCO", type: "stock", tv: "NASDAQ:CSCO", names: ["cisco", "циско"] },
  { ticker: "QCOM", type: "stock", tv: "NASDAQ:QCOM", names: ["qualcomm"] },
  { ticker: "UBER", type: "stock", tv: "NYSE:UBER", names: ["uber", "убэр"] },
  { ticker: "ABNB", type: "stock", tv: "NASDAQ:ABNB", names: ["airbnb", "эйрбиэнби"] },
  { ticker: "SPOT", type: "stock", tv: "NYSE:SPOT", names: ["spotify", "спотифай"] },
  { ticker: "PYPL", type: "stock", tv: "NASDAQ:PYPL", names: ["paypal", "пэйпал"] },

  // ---------- Хувьцаа (Санхүү, жижиглэн, бусад) ----------
  { ticker: "V", type: "stock", tv: "NYSE:V", names: ["visa", "виза"] },
  { ticker: "MA", type: "stock", tv: "NYSE:MA", names: ["mastercard", "мастеркард"] },
  { ticker: "JPM", type: "stock", tv: "NYSE:JPM", names: ["jpmorgan", "жп морган"] },
  { ticker: "BAC", type: "stock", tv: "NYSE:BAC", names: ["bank of america"] },
  { ticker: "WMT", type: "stock", tv: "NYSE:WMT", names: ["walmart", "волмарт"] },
  { ticker: "COST", type: "stock", tv: "NASDAQ:COST", names: ["costco", "костко"] },
  { ticker: "HD", type: "stock", tv: "NYSE:HD", names: ["home depot"] },
  { ticker: "KO", type: "stock", tv: "NYSE:KO", names: ["coca cola", "кока кола"] },
  { ticker: "PEP", type: "stock", tv: "NASDAQ:PEP", names: ["pepsi", "пепси"] },
  { ticker: "MCD", type: "stock", tv: "NYSE:MCD", names: ["mcdonald's", "макдональдс"] },
  { ticker: "NKE", type: "stock", tv: "NYSE:NKE", names: ["nike", "найк"] },
  { ticker: "SBUX", type: "stock", tv: "NASDAQ:SBUX", names: ["starbucks", "старбакс"] },
  { ticker: "DIS", type: "stock", tv: "NYSE:DIS", names: ["disney", "дисней"] },
  { ticker: "BA", type: "stock", tv: "NYSE:BA", names: ["boeing", "боинг"] },
  { ticker: "F", type: "stock", tv: "NYSE:F", names: ["ford", "форд"] },
  { ticker: "GM", type: "stock", tv: "NYSE:GM", names: ["general motors"] },
  { ticker: "XOM", type: "stock", tv: "NYSE:XOM", names: ["exxon", "эксон"] },
  { ticker: "CVX", type: "stock", tv: "NYSE:CVX", names: ["chevron", "шеврон"] },
  { ticker: "PFE", type: "stock", tv: "NYSE:PFE", names: ["pfizer", "пфайзер"] },
  { ticker: "JNJ", type: "stock", tv: "NYSE:JNJ", names: ["johnson & johnson"] },
  { ticker: "T", type: "stock", tv: "NYSE:T", names: ["at&t"] },
  { ticker: "VZ", type: "stock", tv: "NYSE:VZ", names: ["verizon", "веризон"] },
];

function findAsset(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ASSET_DB.filter(a =>
    a.ticker.toLowerCase().includes(q) ||
    a.names.some(n => n.toLowerCase().includes(q))
  );
}
