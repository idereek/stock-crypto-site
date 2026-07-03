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
        ${sparklineSVG(prices, up)}
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">Захын үнэлгээ</span><span class="stat-val">${fmtUSD(marketData.market_cap)}</span></div>
          <div class="stat"><span class="stat-label">24ц эргэлт</span><span class="stat-val">${fmtUSD(marketData.total_volume)}</span></div>
          <div class="stat"><span class="stat-label">7 хоногийн дээд</span><span class="stat-val">${fmtUSD(Math.max(...prices))}</span></div>
          <div class="stat"><span class="stat-label">7 хоногийн доод</span><span class="stat-val">${fmtUSD(Math.min(...prices))}</span></div>
        </div>
        ${newsBlock(asset.ticker)}
      </div>`;
  } catch (e) {
    resultArea.innerHTML = `<div class="error-state">Мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.</div>`;
  }
}

// ---------- Хувьцааны demo карт ----------
function renderStockDemo(asset) {
  const up = asset.demoChange >= 0;
  resultArea.innerHTML = `
    <div class="asset-card">
      <div class="asset-head">
        <div>
          <div class="asset-ticker">${asset.ticker} <span class="asset-name">${asset.names[0]}</span></div>
          <div class="asset-price">${fmtUSD(asset.demoPrice)}
            <span class="chg ${up ? "up" : "down"}">${fmtPct(asset.demoChange)} (24ц)</span>
          </div>
        </div>
        <div class="badge demo">DEMO ӨГӨГДӨЛ</div>
      </div>
      <div class="notice">
        Хувьцааны live үнийг харуулахын тулд Finnhub (үнэгүй) API түлхүүр холбоно.
        Одоогоор жишээ (demo) тоо харуулж байна.
      </div>
      ${newsBlock(asset.ticker)}
    </div>`;
}

// ---------- SVG sparkline график ----------
function sparklineSVG(prices, up) {
  const w = 640, h = 160, pad = 8;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = (max - min) || 1;
  const step = (w - pad * 2) / (prices.length - 1);
  const points = prices.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - ((p - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "var(--gain)" : "var(--loss)";
  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${w} ${h}" class="sparkline" preserveAspectRatio="none">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
      <div class="chart-caption">Сүүлийн 7 хоног</div>
    </div>`;
}

// ---------- Мэдээний жишээ блок (Монгол хэл дээр) ----------
function newsBlock(ticker) {
  const sample = [
    { t: "Захын идэвх өндөр байна", s: "Зах зээлийн эргэлт өдрийн турш тогтмол өссөөр байна." },
    { t: `${ticker}-тэй холбоотой сүүлийн үеийн шинжилгээ`, s: "Аналитикчид дунд хугацааны хэтийн төлөвийг эерэгээр үнэлж байна." },
    { t: "Хэрэглэгчдийн анхаарах зүйл", s: "Богино хугацааны хэлбэлзэл нэмэгдэж болзошгүйг судлаачид анхааруулж байна." },
  ];
  return `
    <div class="news-section">
      <div class="news-title">Холбогдох мэдээ</div>
      ${sample.map(n => `
        <div class="news-item">
          <div class="news-headline">${n.t}</div>
          <div class="news-sub">${n.s}</div>
        </div>`).join("")}
      <div class="news-footnote">* Жишээ мэдээ — production дээр мэдээний API холбож, Монгол хэл рүү орчуулах хэсэг нэмнэ.</div>
    </div>`;
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
