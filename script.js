// ---------- Тусламж функцууд ----------
const fmtUSD = (n) => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ---------- Ticker tape (дээд талын гүйдэг мөр) ----------
async function loadTickerTape() {
  const ids = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "dogecoin"];
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(",")}`);
    const data = await res.json();
    const track = document.getElementById("tickerTrack");
    const items = data.map(c => {
      const up = c.price_change_percentage_24h >= 0;
      return `<span class="tape-item">
        <b>${c.symbol.toUpperCase()}</b> ${fmtUSD(c.current_price)}
        <span class="${up ? "up" : "down"}">${fmtPct(c.price_change_percentage_24h || 0)}</span>
      </span>`;
    }).join("");
    // давхардуулж тавьснаар тасралтгүй гүйнэ
    track.innerHTML = items + items;

    // Hero хэсгийн live mini-stat мөр (эхний 3-ыг харуулна)
    const strip = document.getElementById("heroStrip");
    if (strip) {
      strip.innerHTML = data.slice(0, 3).map(c => {
        const up = c.price_change_percentage_24h >= 0;
        return `<div class="hero-stat">
          <span class="hero-stat-sym">${c.symbol.toUpperCase()}</span>
          <span class="hero-stat-price">${fmtUSD(c.current_price)}</span>
          <span class="hero-stat-chg ${up ? "up" : "down"}">${fmtPct(c.price_change_percentage_24h || 0)}</span>
        </div>`;
      }).join("");
    }
  } catch (e) {
    document.getElementById("tickerTrack").innerHTML =
      `<span class="tape-item">Мэдээлэл татахад алдаа гарлаа — интернэт холболтоо шалгана уу.</span>`;
  }
}

// ---------- Хайлтын санал ----------
const searchInput = document.getElementById("searchInput");
const suggestions = document.getElementById("suggestions");
const resultArea = document.getElementById("resultArea");

searchInput.addEventListener("input", () => {
  const matches = findAsset(searchInput.value);
  if (!matches.length) { suggestions.innerHTML = ""; suggestions.classList.remove("show"); return; }
  suggestions.innerHTML = matches.slice(0, 6).map(m =>
    `<div class="suggestion-item" data-ticker="${m.ticker}">
      <span class="s-ticker">${m.ticker}</span>
      <span class="s-type">${m.type === "crypto" ? "Крипто" : "Хувьцаа"}</span>
    </div>`
  ).join("");
  suggestions.classList.add("show");
});

suggestions.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion-item");
  if (!item) return;
  runSearch(item.dataset.ticker);
  suggestions.classList.remove("show");
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const matches = findAsset(searchInput.value);
    if (matches.length) runSearch(matches[0].ticker);
    suggestions.classList.remove("show");
  }
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => runSearch(chip.dataset.q));
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) suggestions.classList.remove("show");
});

// ---------- Хайлт гүйцэтгэх ----------
async function runSearch(ticker) {
  const asset = ASSET_DB.find(a => a.ticker === ticker);
  if (!asset) return;
  searchInput.value = asset.ticker;
  resultArea.innerHTML = `<div class="loading">Мэдээлэл татаж байна...</div>`;

  if (asset.type === "crypto") {
    await renderCrypto(asset);
  } else {
    renderStockDemo(asset);
  }
}

// ---------- Крипто карт (CoinGecko-с live) ----------
async function renderCrypto(asset) {
  try {
    const [marketRes, chartRes] = await Promise.all([
      fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${asset.coingeckoId}`),
      fetch(`https://api.coingecko.com/api/v3/coins/${asset.coingeckoId}/market_chart?vs_currency=usd&days=7`)
    ]);
    const marketData = (await marketRes.json())[0];
    const chartData = await chartRes.json();
    const prices = chartData.prices.map(p => p[1]);

    const up = marketData.price_change_percentage_24h >= 0;
    resultArea.innerHTML = `
      <div class="asset-card">
        <div class="asset-head">
          <div>
            <div class="asset-ticker">${marketData.symbol.toUpperCase()} <span class="asset-name">${marketData.name}</span></div>
            <div class="asset-price">${fmtUSD(marketData.current_price)}
              <span class="chg ${up ? "up" : "down"}">${fmtPct(marketData.price_change_percentage_24h || 0)} (24ц)</span>
            </div>
          </div>
          <div class="badge live">● LIVE</div>
        </div>
        ${tradingViewChart(asset)}
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">Захын үнэлгээ</span><span class="stat-val">${fmtUSD(marketData.market_cap)}</span></div>
          <div class="stat"><span class="stat-label">24ц эргэлт</span><span class="stat-val">${fmtUSD(marketData.total_volume)}</span></div>
          <div class="stat"><span class="stat-label">7 хоногийн дээд</span><span class="stat-val">${fmtUSD(Math.max(...prices))}</span></div>
          <div class="stat"><span class="stat-label">7 хоногийн доод</span><span class="stat-val">${fmtUSD(Math.min(...prices))}</span></div>
        </div>
        ${newsPlaceholder()}
      </div>`;
    loadNews(asset.ticker, "crypto");
  } catch (e) {
    resultArea.innerHTML = `<div class="error-state">Мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.</div>`;
  }
}

// ---------- Хувьцааны карт (Finnhub-с /api/quote дамжуулан live) ----------
async function renderStockDemo(asset) {
  resultArea.innerHTML = `<div class="loading">Мэдээлэл татаж байна...</div>`;
  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(asset.ticker)}`);
    const data = await res.json();

    if (!res.ok) {
      resultArea.innerHTML = `<div class="error-state">${data.error || "Мэдээлэл татахад алдаа гарлаа"}</div>`;
      return;
    }

    const up = data.percent >= 0;
    resultArea.innerHTML = `
      <div class="asset-card">
        <div class="asset-head">
          <div>
            <div class="asset-ticker">${data.symbol} <span class="asset-name">${asset.names[0]}</span></div>
            <div class="asset-price">${fmtUSD(data.current)}
              <span class="chg ${up ? "up" : "down"}">${fmtPct(data.percent)} (өдрийн)</span>
            </div>
          </div>
          <div class="badge live">● LIVE</div>
        </div>
        ${tradingViewChart(asset)}
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">Нээлтийн үнэ</span><span class="stat-val">${fmtUSD(data.open)}</span></div>
          <div class="stat"><span class="stat-label">Өдрийн дээд</span><span class="stat-val">${fmtUSD(data.high)}</span></div>
          <div class="stat"><span class="stat-label">Өдрийн доод</span><span class="stat-val">${fmtUSD(data.low)}</span></div>
          <div class="stat"><span class="stat-label">Өмнөх хаалт</span><span class="stat-val">${fmtUSD(data.prevClose)}</span></div>
        </div>
        ${newsPlaceholder()}
      </div>`;
    loadNews(asset.ticker, "stock");
  } catch (e) {
    resultArea.innerHTML = `<div class="error-state">Мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.</div>`;
  }
}

// ---------- TradingView chart (crosshair/point курсор native дэмжигдсэн) ----------
function tradingViewChart(asset) {
  if (!asset.tv) {
    return `<div class="notice">Энэ хөрөнгө нь ам.доллартай босоо тогтвортой ханшийг (stablecoin) баримталдаг тул график шаардлагагүй.</div>`;
  }
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(asset.tv)}&interval=D&hide_top_toolbar=1&hide_legend=0&saveimage=0&toolbarbg=F5F7FA&theme=light&style=1&locale=en&withdateranges=1`;
  return `
    <div class="tv-chart-wrap">
      <iframe
        src="${src}"
        title="${asset.ticker} chart"
        loading="lazy"
        frameborder="0"
        allowtransparency="true"
        scrolling="no">
      </iframe>
    </div>`;
}

// ---------- Мэдээний placeholder ба live ачаалагч ----------
function newsPlaceholder() {
  return `<div class="news-section" id="newsSection">
    <div class="news-title">Холбогдох мэдээ</div>
    <div class="loading">Мэдээ ачаалж байна...</div>
  </div>`;
}

async function loadNews(ticker, type) {
  const section = document.getElementById("newsSection");
  if (!section) return;
  try {
    const res = await fetch(`/api/news?symbol=${encodeURIComponent(ticker)}&type=${type}`);
    const data = await res.json();

    if (!res.ok || !data.items || !data.items.length) {
      section.innerHTML = `
        <div class="news-title">Холбогдох мэдээ</div>
        <div class="news-empty">Одоогоор энэ ticker-тэй холбоотой шинэ мэдээ олдсонгүй.</div>`;
      return;
    }

    section.innerHTML = `
      <div class="news-title">Холбогдох мэдээ</div>
      ${data.items.map(n => `
        <a class="news-item" href="${n.url}" target="_blank" rel="noopener noreferrer">
          <div class="news-headline">${n.headline}</div>
          <div class="news-sub">${n.summary}</div>
        </a>`).join("")}
      <div class="news-footnote">* Эх сурвалж: Finnhub / CryptoCompare — Монгол орчуулга автоматаар хийгдсэн.</div>`;
  } catch (e) {
    section.innerHTML = `
      <div class="news-title">Холбогдох мэдээ</div>
      <div class="news-empty">Мэдээ татахад алдаа гарлаа.</div>`;
  }
}

// ---------- Trial timer badge (жишээ логик) ----------
(function initTrialBadge() {
  const btn = document.getElementById("upgradeBtn");
  btn.addEventListener("click", () => {
    alert("Энд Stripe/Payment хуудас руу шилжих холбоос орно.");
  });
})();

loadTickerTape();
setInterval(loadTickerTape, 60000); // минут тутам шинэчилнэ
