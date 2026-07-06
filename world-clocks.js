// world-clocks.js — БҮРЭН БИЕ ДААСАН хувилбар
// index.html-д ЗӨВХӨН доорх 1 МӨРИЙГ нэмнэ (</body>-ийн өмнө, эсвэл bank-rates.js-ийн
// хажууд):
//   <script src="world-clocks.js"></script>
// Энэ файл өөрөө HTML болон CSS-ээ автоматаар DOM-д нэмж, .ticker-tape (урсдаг
// ханшийн зурвас)-ийн ДАРАА байрлуулна. Секунд тутам шинэчлэгдэж ажиллана.

(function () {
  const CITIES = [
    { key: "ub", name: "УЛААНБААТАР", tz: "Asia/Ulaanbaatar" },
    { key: "hk", name: "ХОНГ КОНГ", tz: "Asia/Hong_Kong" },
    { key: "tokyo", name: "ТОКИО", tz: "Asia/Tokyo" },
    { key: "frankfurt", name: "ФРАНКФУРТ", tz: "Europe/Berlin" },
    { key: "london", name: "ЛОНДОН", tz: "Europe/London" },
    { key: "ny", name: "НЬЮ-ЙОРК", tz: "America/New_York" },
  ];

  function injectStyles() {
    if (document.getElementById("world-clocks-styles")) return;
    const style = document.createElement("style");
    style.id = "world-clocks-styles";
    style.textContent = `
      .world-clocks-strip {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 28px;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding: 18px 20px;
        background: var(--panel-2, #F1ECE1);
        border-bottom: 1px solid var(--line, #E7E0D0);
        scrollbar-width: thin;
      }
      .world-clocks-strip::-webkit-scrollbar { height: 4px; }
      .world-clocks-strip::-webkit-scrollbar-thumb { background: var(--line, #E7E0D0); border-radius: 4px; }
      .wc-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .wc-face-wrap { position: relative; width: 62px; height: 62px; }
      .wc-face {
        width: 62px; height: 62px;
        display: block;
      }
      .wc-city {
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 10px;
        letter-spacing: 0.6px;
        color: var(--text-dim, #7A7266);
        font-weight: 600;
        text-align: center;
        white-space: nowrap;
      }
      .wc-digital {
        font-family: var(--mono, ui-monospace, monospace);
        font-size: 10.5px;
        color: var(--text, #1B1712);
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      @media (max-width: 640px) {
        .world-clocks-strip { gap: 18px; padding: 14px 16px; justify-content: flex-start; }
        .wc-face-wrap, .wc-face { width: 50px; height: 50px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildClockSVG(city) {
    return `
      <svg class="wc-face" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="var(--panel, #fff)" stroke="var(--gold, #B8862B)" stroke-width="2"/>
        <g stroke="var(--text-dim, #7A7266)" stroke-width="1.4" stroke-linecap="round">
          <line x1="32" y1="5" x2="32" y2="9"/>
          <line x1="32" y1="55" x2="32" y2="59"/>
          <line x1="5" y1="32" x2="9" y2="32"/>
          <line x1="55" y1="32" x2="59" y2="32"/>
        </g>
        <line id="wc-hour-${city.key}" x1="32" y1="32" x2="32" y2="18" stroke="var(--text, #1B1712)" stroke-width="2.6" stroke-linecap="round"/>
        <line id="wc-min-${city.key}" x1="32" y1="32" x2="32" y2="11" stroke="var(--text, #1B1712)" stroke-width="1.8" stroke-linecap="round"/>
        <line id="wc-sec-${city.key}" x1="32" y1="32" x2="32" y2="9" stroke="var(--loss, #C4463A)" stroke-width="1" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="2.4" fill="var(--gold, #B8862B)"/>
      </svg>
    `;
  }

  function injectSection() {
    if (document.getElementById("worldClocksStrip")) return;
    const strip = document.createElement("div");
    strip.className = "world-clocks-strip";
    strip.id = "worldClocksStrip";
    strip.setAttribute("aria-hidden", "true");

    strip.innerHTML = CITIES.map((c) => `
      <div class="wc-item">
        <div class="wc-face-wrap">${buildClockSVG(c)}</div>
        <span class="wc-city">${c.name}</span>
        <span class="wc-digital" id="wc-digital-${c.key}">--:--</span>
      </div>
    `).join("");

    const tickerTape = document.querySelector(".ticker-tape");
    if (tickerTape && tickerTape.parentElement) {
      tickerTape.parentElement.insertBefore(strip, tickerTape.nextSibling);
    } else {
      document.body.insertBefore(strip, document.body.firstChild);
    }
  }

  function getTimeParts(timeZone) {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = fmt.formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { h: get("hour") % 24, m: get("minute"), s: get("second") };
  }

  function updateClocks() {
    CITIES.forEach((c) => {
      let h, m, s;
      try {
        ({ h, m, s } = getTimeParts(c.tz));
      } catch (err) {
        return; // timezone дэмжигдэхгүй хуучин browser бол алгасна
      }

      const hourDeg = (h % 12) * 30 + m * 0.5;
      const minDeg = m * 6 + s * 0.1;
      const secDeg = s * 6;

      const hourEl = document.getElementById(`wc-hour-${c.key}`);
      const minEl = document.getElementById(`wc-min-${c.key}`);
      const secEl = document.getElementById(`wc-sec-${c.key}`);
      const digitalEl = document.getElementById(`wc-digital-${c.key}`);

      if (hourEl) hourEl.setAttribute("transform", `rotate(${hourDeg} 32 32)`);
      if (minEl) minEl.setAttribute("transform", `rotate(${minDeg} 32 32)`);
      if (secEl) secEl.setAttribute("transform", `rotate(${secDeg} 32 32)`);
      if (digitalEl) {
        digitalEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    injectSection();
    updateClocks();
    setInterval(updateClocks, 1000);
  });
})();
