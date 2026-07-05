// ---------- Дүрэм-суурьтай (rule-based) шинжилгээ — визуал хувилбар ----------
// Шинэ Finnhub/CoinGecko дуудлага НЭМЭХГҮЙ — зөвхөн аль хэдийн татсан дата дээр
// математик тооцоо хийж, гоё дизайнтай (gauge + chip + өгүүлбэр) блок үүсгэнэ.

function positionPct(current, low, high) {
  if (!isFinite(low) || !isFinite(high) || high === low) return 50;
  const pct = ((current - low) / (high - low)) * 100;
  return Math.min(100, Math.max(0, pct));
}

function classifyPosition(pct) {
  if (pct >= 70) return "high";
  if (pct <= 30) return "low";
  return "mid";
}

// ---------- Хувьцаа: өдрийн OHLC дээр үндэслэсэн шинжилгээ ----------
function buildStockAnalysis(data) {
  const posPct = positionPct(data.current, data.low, data.high);
  const posClass = classifyPosition(posPct);
  const trendUp = data.percent >= 0;
  const gapUp = data.current >= data.open;
  const rangePct = data.open ? Math.abs(((data.high - data.low) / data.open) * 100) : 0;

  const narrative = t("analysis_stock")({
    trendUp,
    percent: Math.abs(data.percent || 0).toFixed(2),
    posClass,
    gapUp,
    rangePct: rangePct.toFixed(2),
  });

  return {
    trendUp,
    trendPct: Math.abs(data.percent || 0).toFixed(2),
    posPct,
    rangeLowLabel: t("stat_day_low"),
    rangeHighLabel: t("stat_day_high"),
    rangeLowVal: fmtUSD(data.low),
    rangeHighVal: fmtUSD(data.high),
    chips: [
      { label: t("analysis_chip_range"), value: rangePct.toFixed(2) + "%" },
      { label: t("analysis_chip_vs_open"), value: (gapUp ? "▲ " : "▼ ") + t(gapUp ? "analysis_above_open" : "analysis_below_open") },
    ],
    narrative,
  };
}

// ---------- Крипто: 7 хоногийн үнийн түүх дээр үндэслэсэн шинжилгээ ----------
function buildCryptoAnalysis(marketData, prices) {
  const weekHigh = Math.max(...prices);
  const weekLow = Math.min(...prices);
  const posPct = positionPct(marketData.current_price, weekLow, weekHigh);
  const posClass = classifyPosition(posPct);
  const weekChangePct = prices[0] ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
  const volatilityPct = weekLow ? ((weekHigh - weekLow) / weekLow) * 100 : 0;
  const trend24hUp = (marketData.price_change_percentage_24h || 0) >= 0;

  const narrative = t("analysis_crypto")({
    weekTrendUp: weekChangePct >= 0,
    weekChangePct: Math.abs(weekChangePct).toFixed(2),
    posClass,
    volatilityPct: volatilityPct.toFixed(2),
    trend24hUp,
    change24hPct: Math.abs(marketData.price_change_percentage_24h || 0).toFixed(2),
  });

  return {
    trendUp: weekChangePct >= 0,
    trendPct: Math.abs(weekChangePct).toFixed(2),
    posPct,
    rangeLowLabel: t("stat_week_low"),
    rangeHighLabel: t("stat_week_high"),
    rangeLowVal: fmtUSD(weekLow),
    rangeHighVal: fmtUSD(weekHigh),
    chips: [
      { label: t("analysis_chip_volatility"), value: volatilityPct.toFixed(2) + "%" },
      { label: t("analysis_chip_24h"), value: (trend24hUp ? "▲ " : "▼ ") + Math.abs(marketData.price_change_percentage_24h || 0).toFixed(2) + "%" },
    ],
    narrative,
  };
}

// ---------- HTML angilal ----------
function analysisSection(a) {
  return `
    <div class="analysis-section">
      <div class="analysis-header">
        <span class="analysis-title">${t("analysis_title")}</span>
        <span class="analysis-trend-pill ${a.trendUp ? "up" : "down"}">${a.trendUp ? "▲" : "▼"} ${a.trendPct}%</span>
      </div>

      <div class="analysis-gauge">
        <div class="gauge-track">
          <div class="gauge-marker" style="left:${a.posPct}%"></div>
        </div>
        <div class="gauge-labels">
          <span>${a.rangeLowLabel}<b>${a.rangeLowVal}</b></span>
          <span>${a.rangeHighLabel}<b>${a.rangeHighVal}</b></span>
        </div>
      </div>

      <div class="analysis-chips">
        ${a.chips.map(c => `<div class="analysis-chip"><span class="chip-label">${c.label}</span><span class="chip-val">${c.value}</span></div>`).join("")}
      </div>

      <p class="analysis-body">${a.narrative}</p>
      <div class="analysis-disclaimer">${t("analysis_disclaimer")}</div>
    </div>`;
}
