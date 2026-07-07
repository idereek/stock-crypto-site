// bank-rates.js — БҮРЭН БИЕ ДААСАН хувилбар
// index.html-д ЗӨВХӨН доорх 1 МӨРИЙГ нэмнэ (</body>-ийн өмнө):
//   <script src="bank-rates.js"></script>
// Энэ файл өөрөө HTML section болон CSS-ээ автоматаар үүсгэж хуудсанд нэмнэ.
// supabase-client.js хуудсанд өмнө нь холбогдсон байх ёстой (sb global хувьсагч).

(function () {
  const BANK_ORDER = [
    "mongolbank", "tdb", "golomt", "khaan", "state",
  ];
  const DEFAULT_CURRENCIES = ["USD", "EUR", "GBP", "CNY", "RUB", "JPY", "KRW"];
  const CURRENCY_SYMBOLS = {
    USD: "$", EUR: "€", GBP: "£", CNY: "¥",
    RUB: "₽", JPY: "¥", KRW: "₩", CAD: "$",
    AUD: "$", NZD: "$", HKD: "$", SGD: "$",
    CHF: "₣", INR: "₹", KZT: "₸",
  };
  const CURRENCY_COUNTRY_CODE = {
    USD: "us", EUR: "eu", GBP: "gb", CNY: "cn",
    RUB: "ru", JPY: "jp", KRW: "kr", CAD: "ca",
    AUD: "au", NZD: "nz", HKD: "hk", SGD: "sg",
    CHF: "ch", INR: "in", KZT: "kz",
  };
  function flagImg(currency) {
    const cc = CURRENCY_COUNTRY_CODE[currency];
    if (!cc) return "";
    return `<img src="https://flagcdn.com/w20/${cc}.png" alt="" width="18" style="vertical-align:middle;border-radius:2px;">`;
  }

  function injectStyles() {
    if (document.getElementById("bank-rates-styles")) return;
    const style = document.createElement("style");
    style.id = "bank-rates-styles";
    style.textContent = `
      .bank-rates-section { margin: 32px auto; max-width: 960px; padding: 0 16px; }
      .bank-rates-section h2 { font-size: 1.3rem; margin-bottom: 12px; }
      .bank-rates-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .bank-rates-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 560px; border: 1px solid #e5e2da; }
      .bank-rates-table th, .bank-rates-table td { padding: 8px 10px; text-align: left; white-space: nowrap; border: 1px solid #e5e2da; }
      .bank-rates-table th:first-child, .bank-rates-table td:first-child { font-weight: 600; }
      .bank-rates-currency { display: grid; grid-template-columns: 18px 22px auto; align-items: center; gap: 6px; }
      .bank-rates-currency span:first-child { text-align: center; }
      .bank-rates-currency img { display: block; }
      .bank-rates-table thead tr:first-child th { font-weight: 700; color: #1a1a1a; text-align: center; }
      .bank-rates-table thead tr:last-child th { font-size: 0.78rem; font-weight: 500; color: #6b6b6b; }
      .bank-rates-best { color: #1a1a1a; font-weight: 400; }
      .bank-rates-error { font-size: 0.9rem; color: #6b6b6b; padding: 12px 0; }
    `;
    document.head.appendChild(style);
  }

  function injectSection() {
    if (document.getElementById("bankRatesContainer")) return;
    const section = document.createElement("section");
    section.className = "bank-rates-section";
    section.innerHTML =
      '<h2>Ханшийн мэдээлэл</h2>' +
      '<div id="bankRatesContainer"><p class="bank-rates-error">Ачаалж байна...</p></div>';

    const footer = document.querySelector("footer");
    if (footer && footer.parentElement) {
      footer.parentElement.insertBefore(section, footer);
    } else {
      document.body.appendChild(section);
    }
  }

  async function loadBankRates() {
    const container = document.getElementById("bankRatesContainer");
    if (!container) return;

    if (typeof sb === "undefined") {
      container.innerHTML =
        '<p class="bank-rates-error">Supabase клиент (sb) олдсонгүй — supabase-client.js зөв холбогдсон эсэхийг шалгана уу.</p>';
      return;
    }

    try {
      const { data, error } = await sb
        .from("bank_rates")
        .select("*")
        .order("currency", { ascending: true });

      if (error) throw error;
      renderTable(container, data || []);
    } catch (err) {
      console.error("Банкны ханш ачаалахад алдаа гарлаа:", err);
      container.innerHTML =
        '<p class="bank-rates-error">Банкны ханшийн мэдээлэл түр ачаалагдсангүй.</p>';
    }
  }

  function renderTable(container, rows) {
    if (!rows.length) {
      container.innerHTML = '<p class="bank-rates-error">Одоогоор ханшийн дата алга байна.</p>';
      return;
    }

    const banksPresent = BANK_ORDER.filter((b) => rows.some((r) => r.bank === b));
    const currencies = DEFAULT_CURRENCIES.filter((c) => rows.some((r) => r.currency === c));

    const byKey = {};
    rows.forEach((r) => {
      byKey[r.bank + "__" + r.currency] = r;
    });

    let html = '<div class="bank-rates-table-wrap"><table class="bank-rates-table">';
    html += "<thead><tr><th>Валют</th>";
    banksPresent.forEach((b) => {
      const rawLabel = rows.find((r) => r.bank === b)?.bank_name_mn || b;
      const label = b === "mongolbank" ? "Монголбанк" : rawLabel;
      html += `<th colspan="2">${label}</th>`;
    });
    html += "</tr><tr><th></th>";
    banksPresent.forEach(() => {
      html += "<th>Авах</th><th>Зарах</th>";
    });
    html += "</tr></thead><tbody>";

    currencies.forEach((currency) => {
      html += `<tr><td class="bank-rates-currency"><span>${CURRENCY_SYMBOLS[currency] || ""}</span>${flagImg(currency)}<span>${currency}</span></td>`;
      const cellsForCurrency = banksPresent.map((b) => byKey[b + "__" + currency]);
      const buyValues = cellsForCurrency.map((c) => c?.buy_cash).filter((v) => v != null);
      const sellValues = cellsForCurrency.map((c) => c?.sell_cash).filter((v) => v != null);
      const bestBuy = buyValues.length ? Math.max(...buyValues) : null;
      const bestSell = sellValues.length ? Math.min(...sellValues) : null;

      banksPresent.forEach((b) => {
        const cell = byKey[b + "__" + currency];
        // Монголбанк (mongolbank) нь Авах/Зарах биш, ганц "албан ханш" (official) утгатай
        const buy = b === "mongolbank" ? cell?.official : cell?.buy_cash;
        const sell = b === "mongolbank" ? cell?.official : cell?.sell_cash;
        const buyClass = b !== "mongolbank" && buy != null && buy === bestBuy ? " bank-rates-best" : "";
        const sellClass = b !== "mongolbank" && sell != null && sell === bestSell ? " bank-rates-best" : "";
        html += `<td class="${buyClass}">${buy != null ? formatRate(buy) : "—"}</td>`;
        html += `<td class="${sellClass}">${sell != null ? formatRate(sell) : "—"}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table></div>";

    container.innerHTML = html;
  }

  function formatRate(n) {
    return Number(n).toLocaleString("mn-MN", { maximumFractionDigits: 2 });
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();
    injectSection();
    loadBankRates();
  });
})();
