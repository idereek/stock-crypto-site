// ---------- Тусламж функцууд ----------
const fmtUSD = (n) => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ---------- Finnhub квот-той (60 req/мин, хуваалцсан key) харилцахдаа бөөнөөрөө биш,
// жижиг багцаар saataitai дуудаж, "burst" болж татгалзуулахаас сэргийлнэ ----------
async function fetchQuotesBatched(symbols, batchSize = 4, delayMs = 300) {
  const out = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(s =>
        fetch(`/api/quote?symbol=${encodeURIComponent(s)}`)
          .then(r => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    );
    out.push(...batchResults);
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return out;
}

// ---------- Ticker tape-ийн жигд, гацалтгүй урсгал (CSS animation-ий оронд) ----------
// CSS @keyframes ашиглавал 3 минут тутамд content шинэчлэгдэхэд animation дахин
// эхэлж, нэг жижиг "үсрэлт" үүсгэдэг байсан. Үүний оронд offset-ийг өөрөө тооцож,
// transform-ээр байнга шилжүүлж байвал ямар ч content шинэчлэлт үүнд нөлөөлөхгүй.
const TICKER_PX_PER_SECOND = 55;
let tickerOffset = 0;
let tickerRAFStarted = false;
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function startTickerScroll() {
  if (tickerRAFStarted || prefersReducedMotion) return;
  tickerRAFStarted = true;
  const track = document.getElementById("tickerTrack");
  let lastTime = null;

  function step(now) {
    if (lastTime === null) lastTime = now;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const halfWidth = track.scrollWidth / 2; // давхардуулж тавьсан тул нийт өргөнийн хагас
    if (halfWidth > 0) {
      tickerOffset -= TICKER_PX_PER_SECOND * dt;
      if (tickerOffset <= -halfWidth) tickerOffset += halfWidth; // яг үзэгдэхгүйгээр "гагцхан" шилжинэ (seamless)
      track.style.transform = `translateX(${tickerOffset}px)`;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ---------- Ticker tape (дээд талын гүйдэг мөр): крипто + хувьцаа + түүхий эд ----------
async function loadTickerTape() {
  let cryptoData = [];
  let stockItems = "";
  let metalItems = "";
  let commodityItems = "";

  // Крипто (CoinGecko) — лого зургийг API-с шууд авна
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TAPE_CRYPTO_IDS.join(",")}`);
    cryptoData = await res.json();
  } catch (e) { /* доор алдааны боловсруулалт хийнэ */ }

  const cryptoItems = cryptoData.map(c => {
    const up = c.price_change_percentage_24h >= 0;
    return `<span class="tape-item">
      <img class="tape-logo" src="${c.image}" alt="" onerror="this.style.display='none'">
      <b>${c.symbol.toUpperCase()}</b> ${fmtUSD(c.current_price)}
      <span class="${up ? "up" : "down"}">${fmtPct(c.price_change_percentage_24h || 0)}</span>
    </span>`;
  }).join("");

  // Хувьцаа (манай /api/quote, Finnhub-с) — Clearbit-с логог домайноор нь татна
  // Анхаар: 20 ticker-ийг зэрэг биш, багцаар нь дуудна (Finnhub key хуваалцсан тул burst-с сэргийлнэ)
  try {
    const results = await fetchQuotesBatched(TAPE_STOCK_SYMBOLS, 4, 300);
    stockItems = results.filter(Boolean).map(d => {
      const meta = ASSET_DB.find(a => a.ticker === d.symbol);
      const up = d.percent >= 0;
      const logo = meta?.domain
        ? `<img class="tape-logo" src="https://www.google.com/s2/favicons?domain=${meta.domain}&sz=64" alt="" onerror="this.style.display='none'">`
        : "";
      return `<span class="tape-item">
        ${logo}<b>${d.symbol}</b> ${fmtUSD(d.current)}
        <span class="${up ? "up" : "down"}">${fmtPct(d.percent || 0)}</span>
      </span>`;
    }).join("");
  } catch (e) { /* хувьцааны дата авахад алдаа гарвал зүгээр алгасна */ }

  // Алт / мөнгө (key шаардахгүй нээлттэй эх сурвалж) + Зэс (Мөнгөний ард шууд байрлана)
  try {
    const [goldRes, silverRes, copperResults] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU"),
      fetch("https://api.gold-api.com/price/XAG"),
      fetchQuotesBatched(["CPER"], 1, 0),
    ]);
    const gold = goldRes.ok ? await goldRes.json() : null;
    const silver = silverRes.ok ? await silverRes.json() : null;
    const copper = copperResults[0];
    metalItems = [
      gold ? `<span class="tape-item">🥇 <b>Алт (XAU)</b> ${fmtUSD(gold.price)}</span>` : "",
      silver ? `<span class="tape-item">🥈 <b>Мөнгө (XAG)</b> ${fmtUSD(silver.price)}</span>` : "",
      copper ? `<span class="tape-item">🟤 <b>Зэс</b> ${fmtUSD(copper.current)}
        <span class="${copper.percent >= 0 ? "up" : "down"}">${fmtPct(copper.percent || 0)}</span>
      </span>` : "",
    ].join("");
  } catch (e) { /* metals эх сурвалж ажиллахгүй бол зүгээр алгасна */ }

  // Түүхий эд — ETF proxy-гоор, Finnhub-с (энэ ч бас багцаар)
  try {
    const results = await fetchQuotesBatched(TAPE_COMMODITIES.map(c => c.symbol), 4, 300);
    commodityItems = results.map((d, i) => {
      if (!d) return "";
      const meta = TAPE_COMMODITIES[i];
      const up = d.percent >= 0;
      return `<span class="tape-item">
        ${meta.icon} <b>${meta.label}</b> ${fmtUSD(d.current)}
        <span class="${up ? "up" : "down"}">${fmtPct(d.percent || 0)}</span>
      </span>`;
    }).join("");
  } catch (e) { /* commodity дата авахад алдаа гарвал зүгээр алгасна */ }

  const track = document.getElementById("tickerTrack");
  const allItems = cryptoItems + stockItems + metalItems + commodityItems;
  if (!allItems) {
    track.innerHTML = `<span class="tape-item">${t("tape_loading_error")}</span>`;
    return;
  }
  // давхардуулж тавьснаар тасралтгүй гүйнэ
  track.innerHTML = allItems + allItems;
  // Анивчилт/гацалтгүй жигд урсгалыг эхлүүлнэ (эсвэл аль хэдийн ажиллаж байгаа бол continue хийнэ) —
  // доор бүрэн тайлбартай startTickerScroll() функц харна.
  startTickerScroll();

  // Hero хэсгийн live mini-stat мөр (эхний 3 криптог харуулна)
  const strip = document.getElementById("heroStrip");
  if (strip && cryptoData.length) {
    strip.innerHTML = cryptoData.slice(0, 3).map(c => {
      const up = c.price_change_percentage_24h >= 0;
      return `<div class="hero-stat">
        <span class="hero-stat-sym">${c.symbol.toUpperCase()}</span>
        <span class="hero-stat-price">${fmtUSD(c.current_price)}</span>
        <span class="hero-stat-chg ${up ? "up" : "down"}">${fmtPct(c.price_change_percentage_24h || 0)}</span>
      </div>`;
    }).join("");
  }
}

// ---------- Дэлхийн зах зээлийн index box-ууд (ETF proxy-гоор, TradingView-гүй) ----------
async function loadIndicesBoxes() {
  const boxes = Array.from(document.querySelectorAll("#indicesGrid .index-box"));
  const symbols = boxes.map(b => b.dataset.symbol);
  const results = await fetchQuotesBatched(symbols, 4, 300);
  boxes.forEach((box, i) => {
    const data = results[i];
    if (!data) {
      box.querySelector(".index-price").textContent = "—";
      box.querySelector(".index-chg").textContent = t("index_error");
      return;
    }
    const up = data.percent >= 0;
    box.querySelector(".index-price").textContent = fmtUSD(data.current);
    const chg = box.querySelector(".index-chg");
    chg.textContent = fmtPct(data.percent || 0);
    chg.classList.add(up ? "up" : "down");
  });
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
      <span class="s-type">${m.type === "crypto" ? t("type_crypto") : t("type_stock")}</span>
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
  resultArea.innerHTML = `<div class="loading">${t("loading")}</div>`;

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
    if (!marketRes.ok) throw new Error(`CoinGecko markets ${marketRes.status}`);
    if (!chartRes.ok) throw new Error(`CoinGecko market_chart ${chartRes.status}`);
    const marketData = (await marketRes.json())[0];
    if (!marketData) throw new Error("CoinGecko: coin олдсонгүй (marketData хоосон)");
    const chartData = await chartRes.json();
    const prices = chartData.prices.map(p => p[1]);
    const up = marketData.price_change_percentage_24h >= 0;

    resultArea.innerHTML = `
      <div class="asset-card">
        <div class="asset-head">
          <div class="asset-head-left">
            <span class="asset-type-tag">${t("type_crypto")}</span>
            <span class="asset-ticker">${marketData.symbol.toUpperCase()}</span>
            <span class="asset-price-inline">${fmtUSD(marketData.current_price)}
              <span class="chg ${up ? "up" : "down"}">${fmtPct(marketData.price_change_percentage_24h || 0)} ${t("chg_24h_suffix")}</span>
            </span>
          </div>
          <div class="badge-group">
            <button class="watch-star" data-ticker="${asset.ticker}" title="Watchlist" type="button">☆</button>
            <div class="badge live"><span class="live-dot"></span>LIVE</div>
          </div>
        </div>
        ${tradingViewChart(asset)}
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">${t("stat_market_cap")}</span><span class="stat-val">${fmtUSD(marketData.market_cap)}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_volume_24h")}</span><span class="stat-val">${fmtUSD(marketData.total_volume)}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_week_high")}</span><span class="stat-val">${fmtUSD(Math.max(...prices))}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_week_low")}</span><span class="stat-val">${fmtUSD(Math.min(...prices))}</span></div>
        </div>
        ${analysisSection(buildCryptoAnalysis(marketData, prices))}
        ${newsPlaceholder()}
      </div>`;
  } catch (e) {
    resultArea.innerHTML = `<div class="error-state">${t("error_state")}<br><small style="opacity:0.6;font-size:11px;">${e && e.message ? e.message : e}</small></div>`;
    return;
  }
  // Доорх хоёр нь "нэмэлт" боломж (мэдээ, watchlist) — эвдэрсэн ч дээрх амжилттай
  // зурсан картыг ХЭЗЭЭ Ч дарж бичихгүй, тусад нь алдаагаа зэрэглэнэ.
  try { loadNews(asset.ticker, "crypto", asset.names[0]); } catch (e) { console.error("loadNews failed:", e); }
  try {
    if (typeof wireWatchStar === "function") wireWatchStar(asset.ticker, "crypto");
  } catch (e) { console.error("wireWatchStar failed:", e); }
}

// ---------- Хувьцааны карт (Finnhub-с /api/quote дамжуулан live) ----------
async function renderStockDemo(asset) {
  resultArea.innerHTML = `<div class="loading">${t("loading")}</div>`;
  try {
    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(asset.ticker)}`);
    const data = await res.json();

    if (!res.ok) {
      resultArea.innerHTML = `<div class="error-state">${data.error || t("error_state")}</div>`;
      return;
    }

    const up = data.percent >= 0;
    resultArea.innerHTML = `
      <div class="asset-card">
        <div class="asset-head">
          <div class="asset-head-left">
            <span class="asset-type-tag">${t("type_stock")}</span>
            <span class="asset-ticker">${data.symbol}</span>
            <span class="asset-price-inline">${fmtUSD(data.current)}
              <span class="chg ${up ? "up" : "down"}">${fmtPct(data.percent)} ${t("chg_today_suffix")}</span>
            </span>
          </div>
          <div class="badge-group">
            <button class="watch-star" data-ticker="${asset.ticker}" title="Watchlist" type="button">☆</button>
            <div class="badge live"><span class="live-dot"></span>LIVE</div>
          </div>
        </div>
        ${tradingViewChart(asset)}
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">${t("stat_open")}</span><span class="stat-val">${fmtUSD(data.open)}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_day_high")}</span><span class="stat-val">${fmtUSD(data.high)}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_day_low")}</span><span class="stat-val">${fmtUSD(data.low)}</span></div>
          <div class="stat"><span class="stat-label">${t("stat_prev_close")}</span><span class="stat-val">${fmtUSD(data.prevClose)}</span></div>
        </div>
        ${analysisSection(buildStockAnalysis(data))}
        ${newsPlaceholder()}
      </div>`;
  } catch (e) {
    resultArea.innerHTML = `<div class="error-state">${t("error_state")}<br><small style="opacity:0.6;font-size:11px;">${e && e.message ? e.message : e}</small></div>`;
    return;
  }
  try { loadNews(asset.ticker, "stock"); } catch (e) { console.error("loadNews failed:", e); }
  try {
    if (typeof wireWatchStar === "function") wireWatchStar(asset.ticker, "stock");
  } catch (e) { console.error("wireWatchStar failed:", e); }
}

// ---------- TradingView chart (crosshair/point курсор native дэмжигдсэн) ----------
function tradingViewChart(asset) {
  if (!asset.tv) {
    return `<div class="notice">${t("stablecoin_notice")}</div>`;
  }
  // TradingView-д Монгол locale байхгүй тул аль ч тохиолдолд Англи UI-тай (data өөрөө хэлнээс үл хамааран LIVE)
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
    <div class="news-title">${t("news_title")}</div>
    <div class="loading">${t("news_loading")}</div>
  </div>`;
}

async function loadNews(ticker, type, nameHint) {
  const section = document.getElementById("newsSection");
  if (!section) return;
  const lang = getLang();
  try {
    // EN сонгосон бол сервер рүү lang=en дамжуулж, Монгол орчуулгын алхмыг алгасуулна
    // (энэ нь MyMemory API-ийн өдрийн хязгаарыг ч хамгаална).
    // Крипто-д coin-ы нэрийг (name) нэмж дамжуулж, ерөнхий крипто мэдээнээс хамааралтайг нь шүүнэ.
    const nameParam = nameHint ? `&name=${encodeURIComponent(nameHint)}` : "";
    const res = await fetch(`/api/news?symbol=${encodeURIComponent(ticker)}&type=${type}&lang=${lang}${nameParam}`);
    const data = await res.json();

    if (!res.ok || !data.items || !data.items.length) {
      section.innerHTML = `
        <div class="news-title">${t("news_title")}</div>
        <div class="news-empty">${t("news_empty")}</div>`;
      return;
    }

    const footnoteKey = lang === "en" ? "news_footnote_en" : "news_footnote";
    section.innerHTML = `
      <div class="news-title">${t("news_title")}</div>
      ${data.items.map(n => `
        <a class="news-item" href="${n.url}" target="_blank" rel="noopener noreferrer">
          <div class="news-headline">${n.headline}</div>
          <div class="news-sub">${n.summary}</div>
        </a>`).join("")}
      <div class="news-footnote">${t(footnoteKey)}</div>`;
  } catch (e) {
    section.innerHTML = `
      <div class="news-title">${t("news_title")}</div>
      <div class="news-empty">${t("news_error")}</div>`;
  }
}

// ---------- Trial timer badge — бодит логик auth.js дотор (renderUpgradeBtnFromProfile) ----------
// Login/Signup товчнуудын click handler-ийг ЭНД биш, auth.js дотор бүртгэсэн (жинхэнэ modal нээнэ).
(function initUpgradeBtnClick() {
  document.getElementById("upgradeBtn")?.addEventListener("click", () => {
    if (typeof currentUser !== "undefined" && currentUser) {
      alert(t("upgrade_placeholder"));
    } else {
      openAuthModal("signup");
    }
  });
})();

// i18n.js-ээс дуудагдана: хэл солигдох бүрд динамик (JS-ээр generate хийсэн) текстүүдийг дахин зурна
function onLanguageChanged() {
  if (typeof renderUpgradeBtnFromProfile === "function") renderUpgradeBtnFromProfile();
  // Одоогийн хайлтын үр дүн (хэрэв нээлттэй байвал) шинэ хэл дээр дахин зурагдана
  const currentTicker = searchInput.value.trim().toUpperCase();
  const currentAsset = ASSET_DB.find(a => a.ticker === currentTicker);
  if (currentAsset && resultArea.querySelector(".asset-card")) {
    runSearch(currentAsset.ticker);
  }
}

// Ticker tape болон index box-уудыг зэрэг биш дараалалтай ачаална
// (нэг Finnhub key-г бүх хэрэглэгч хуваалцдаг тул нэг мөчид хэт олон хүсэлт үүсэхгүйн тулд)
async function refreshLiveData() {
  await loadTickerTape();
  await loadIndicesBoxes();
}
refreshLiveData();
setInterval(refreshLiveData, 180000); // 3 минут тутам
