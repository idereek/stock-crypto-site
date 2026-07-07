// world-clocks.js — БҮРЭН БИЕ ДААСАН хувилбар (Scoreboard/LED digital дизайн)
// index.html-д ЗӨВХӨН доорх 1 МӨРИЙГ нэмнэ (</body>-ийн өмнө):
//   <script src="world-clocks.js"></script>
// Энэ файл өөрөө HTML болон CSS-ээ автоматаар DOM-д нэмж, .ticker-tape
// (урсдаг ханшийн зурвас)-ийн ДАРАА байрлуулна. Секунд тутам шинэчлэгдэж ажиллана.
// Улаанбаатар (эхний) болон Нью-Йорк (сүүлийн) цаг том, тодруулагдсан "hero" загвартай.

(function () {
  const CITIES = [
    { key: "ub", name: "УЛААНБААТАР", tz: "Asia/Ulaanbaatar", hero: true },
    { key: "hk", name: "ХОНГ КОНГ", tz: "Asia/Hong_Kong", hero: false },
    { key: "tokyo", name: "ТОКИО", tz: "Asia/Tokyo", hero: false },
    { key: "frankfurt", name: "ФРАНКФУРТ", tz: "Europe/Berlin", hero: false },
    { key: "london", name: "ЛОНДОН", tz: "Europe/London", hero: false },
    { key: "ny", name: "НЬЮ-ЙОРК", tz: "America/New_York", hero: true },
  ];

  function loadFont() {
    if (document.getElementById("wc-orbitron-font")) return;
    const link = document.createElement("link");
    link.id = "wc-orbitron-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&display=swap";
    document.head.appendChild(link);
  }

  function injectStyles() {
    if (document.getElementById("world-clocks-styles")) return;
    const style = document.createElement("style");
    style.id = "world-clocks-styles";
    style.textContent = `
      .world-clocks-strip {
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 10px;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding: 16px 20px;
        background: #0e0b07;
        border-bottom: 1px solid #2a2118;
        scrollbar-width: thin;
      }
      .world-clocks-strip::-webkit-scrollbar { height: 4px; }
      .world-clocks-strip::-webkit-scrollbar-thumb { background: #2a2118; border-radius: 4px; }
      .wc-card {
        background: #14100a;
        border: 1px solid #2a2118;
        border-radius: 8px;
        padding: 10px 8px;
        text-align: center;
        flex-shrink: 0;
        min-width: 92px;
      }
      .wc-card.wc-hero {
        background: #1a1409;
        border: 1px solid #3d2f18;
        min-width: 112px;
      }
      .wc-city {
        font-family: var(--sans, sans-serif);
        font-size: 9px;
        color: #8a7a5c;
        margin-bottom: 6px;
        white-space: nowrap;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .wc-time {
        font-family: 'Orbitron', var(--mono, monospace);
        font-size: 19px;
        font-weight: 700;
        color: #e8b23d;
        letter-spacing: 1px;
        text-shadow: 0 0 8px rgba(232,178,61,0.45);
      }
      .wc-card.wc-hero .wc-time {
        font-size: 25px;
        font-weight: 900;
        color: #ff8a3d;
        text-shadow: 0 0 12px rgba(255,138,61,0.55);
      }
      @media (max-width: 640px) {
        .world-clocks-strip { gap: 8px; padding: 12px 14px; justify-content: flex-start; }
        .wc-card { min-width: 78px; padding: 8px 6px; }
        .wc-card.wc-hero { min-width: 92px; }
        .wc-time { font-size: 16px; }
        .wc-card.wc-hero .wc-time { font-size: 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectSection() {
    if (document.getElementById("worldClocksStrip")) return;
    const strip = document.createElement("div");
    strip.className = "world-clocks-strip";
    strip.id = "worldClocksStrip";
    strip.setAttribute("aria-hidden", "true");

    strip.innerHTML = CITIES.map((c) => `
      <div class="wc-card${c.hero ? " wc-hero" : ""}">
        <div class="wc-city">${c.name}</div>
        <div class="wc-time" id="wc-time-${c.key}">--:--</div>
      </div>
    `).join("");

    const tickerTape = document.querySelector(".ticker-tape");
    if (tickerTape && tickerTape.parentElement) {
      tickerTape.parentElement.insertBefore(strip, tickerTape.nextSibling);
    } else {
      document.body.insertBefore(strip, document.body.firstChild);
    }
  }

  function updateClocks() {
    CITIES.forEach((c) => {
      const el = document.getElementById(`wc-time-${c.key}`);
      if (!el) return;
      try {
        const fmt = new Intl.DateTimeFormat("en-GB", {
          timeZone: c.tz,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
        el.textContent = fmt.format(new Date());
      } catch (err) {
        // timezone дэмжигдэхгүй хуучин browser бол алгасна
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadFont();
    injectStyles();
    injectSection();
    updateClocks();
    setInterval(updateClocks, 1000);
  });
})();
