// Ticker / нэрийн толь бичиг — хайлтыг Монгол болон Англи хэлээр аль алинаар нь дэмжинэ.
// type: "crypto" -> CoinGecko id ашиглана (key шаардлагагүй)
//       "stock"  -> Finnhub-с /api/quote дамжуулан live (key server талд нуугдсан)

const ASSET_DB = [
  // ---------- Крипто ----------
  { ticker: "BTC", type: "crypto", coingeckoId: "bitcoin", names: ["bitcoin", "биткойн"] },
  { ticker: "ETH", type: "crypto", coingeckoId: "ethereum", names: ["ethereum", "этериум", "эфир"] },
  { ticker: "USDT", type: "crypto", coingeckoId: "tether", names: ["tether", "тезер"] },
  { ticker: "BNB", type: "crypto", coingeckoId: "binancecoin", names: ["binance coin", "бинанс"] },
  { ticker: "SOL", type: "crypto", coingeckoId: "solana", names: ["solana", "солана"] },
  { ticker: "USDC", type: "crypto", coingeckoId: "usd-coin", names: ["usd coin"] },
  { ticker: "XRP", type: "crypto", coingeckoId: "ripple", names: ["ripple", "рипл"] },
  { ticker: "ADA", type: "crypto", coingeckoId: "cardano", names: ["cardano", "кардано"] },
  { ticker: "DOGE", type: "crypto", coingeckoId: "dogecoin", names: ["dogecoin", "дожкойн"] },
  { ticker: "TRX", type: "crypto", coingeckoId: "tron", names: ["tron", "трон"] },
  { ticker: "AVAX", type: "crypto", coingeckoId: "avalanche-2", names: ["avalanche"] },
  { ticker: "LINK", type: "crypto", coingeckoId: "chainlink", names: ["chainlink", "чэйнлинк"] },
  { ticker: "DOT", type: "crypto", coingeckoId: "polkadot", names: ["polkadot", "полкадот"] },
  { ticker: "MATIC", type: "crypto", coingeckoId: "matic-network", names: ["polygon", "полигон"] },
  { ticker: "LTC", type: "crypto", coingeckoId: "litecoin", names: ["litecoin", "лайткойн"] },
  { ticker: "SHIB", type: "crypto", coingeckoId: "shiba-inu", names: ["shiba inu", "шиба"] },
  { ticker: "BCH", type: "crypto", coingeckoId: "bitcoin-cash", names: ["bitcoin cash"] },
  { ticker: "UNI", type: "crypto", coingeckoId: "uniswap", names: ["uniswap", "юнисвап"] },
  { ticker: "XLM", type: "crypto", coingeckoId: "stellar", names: ["stellar", "стеллар"] },
  { ticker: "XMR", type: "crypto", coingeckoId: "monero", names: ["monero", "монеро"] },
  { ticker: "APT", type: "crypto", coingeckoId: "aptos", names: ["aptos", "аптос"] },
  { ticker: "NEAR", type: "crypto", coingeckoId: "near", names: ["near protocol"] },
  { ticker: "ICP", type: "crypto", coingeckoId: "internet-computer", names: ["internet computer"] },
  { ticker: "ARB", type: "crypto", coingeckoId: "arbitrum", names: ["arbitrum"] },
  { ticker: "OP", type: "crypto", coingeckoId: "optimism", names: ["optimism"] },
  { ticker: "ATOM", type: "crypto", coingeckoId: "cosmos", names: ["cosmos", "космос"] },
  { ticker: "ALGO", type: "crypto", coingeckoId: "algorand", names: ["algorand"] },
  { ticker: "AAVE", type: "crypto", coingeckoId: "aave", names: ["aave"] },
  { ticker: "MKR", type: "crypto", coingeckoId: "maker", names: ["maker"] },
  { ticker: "FTM", type: "crypto", coingeckoId: "fantom", names: ["fantom"] },

  // ---------- Хувьцаа (Technology) ----------
  { ticker: "AAPL", type: "stock", names: ["apple", "аппл", "эппл"] },
  { ticker: "MSFT", type: "stock", names: ["microsoft", "майкрософт"] },
  { ticker: "GOOGL", type: "stock", names: ["google", "гүүгл", "alphabet"] },
  { ticker: "AMZN", type: "stock", names: ["amazon", "амазон"] },
  { ticker: "META", type: "stock", names: ["meta", "facebook", "фэйсбүүк"] },
  { ticker: "NVDA", type: "stock", names: ["nvidia", "нвидиа"] },
  { ticker: "TSLA", type: "stock", names: ["tesla", "тесла"] },
  { ticker: "NFLX", type: "stock", names: ["netflix", "нэтфликс"] },
  { ticker: "AMD", type: "stock", names: ["amd"] },
  { ticker: "INTC", type: "stock", names: ["intel", "интел"] },
  { ticker: "ORCL", type: "stock", names: ["oracle", "оракл"] },
  { ticker: "CRM", type: "stock", names: ["salesforce"] },
  { ticker: "ADBE", type: "stock", names: ["adobe", "адоб"] },
  { ticker: "IBM", type: "stock", names: ["ibm"] },
  { ticker: "CSCO", type: "stock", names: ["cisco", "циско"] },
  { ticker: "QCOM", type: "stock", names: ["qualcomm"] },
  { ticker: "UBER", type: "stock", names: ["uber", "убэр"] },
  { ticker: "ABNB", type: "stock", names: ["airbnb", "эйрбиэнби"] },
  { ticker: "SPOT", type: "stock", names: ["spotify", "спотифай"] },
  { ticker: "PYPL", type: "stock", names: ["paypal", "пэйпал"] },

  // ---------- Хувьцаа (Санхүү, жижиглэн, бусад) ----------
  { ticker: "V", type: "stock", names: ["visa", "виза"] },
  { ticker: "MA", type: "stock", names: ["mastercard", "мастеркард"] },
  { ticker: "JPM", type: "stock", names: ["jpmorgan", "жп морган"] },
  { ticker: "BAC", type: "stock", names: ["bank of america"] },
  { ticker: "WMT", type: "stock", names: ["walmart", "волмарт"] },
  { ticker: "COST", type: "stock", names: ["costco", "костко"] },
  { ticker: "HD", type: "stock", names: ["home depot"] },
  { ticker: "KO", type: "stock", names: ["coca cola", "кока кола"] },
  { ticker: "PEP", type: "stock", names: ["pepsi", "пепси"] },
  { ticker: "MCD", type: "stock", names: ["mcdonald's", "макдональдс"] },
  { ticker: "NKE", type: "stock", names: ["nike", "найк"] },
  { ticker: "SBUX", type: "stock", names: ["starbucks", "старбакс"] },
  { ticker: "DIS", type: "stock", names: ["disney", "дисней"] },
  { ticker: "BA", type: "stock", names: ["boeing", "боинг"] },
  { ticker: "F", type: "stock", names: ["ford", "форд"] },
  { ticker: "GM", type: "stock", names: ["general motors"] },
  { ticker: "XOM", type: "stock", names: ["exxon", "эксон"] },
  { ticker: "CVX", type: "stock", names: ["chevron", "шеврон"] },
  { ticker: "PFE", type: "stock", names: ["pfizer", "пфайзер"] },
  { ticker: "JNJ", type: "stock", names: ["johnson & johnson"] },
  { ticker: "T", type: "stock", names: ["at&t"] },
  { ticker: "VZ", type: "stock", names: ["verizon", "веризон"] },
];

function findAsset(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ASSET_DB.filter(a =>
    a.ticker.toLowerCase().includes(q) ||
    a.names.some(n => n.toLowerCase().includes(q))
  );
}
