// bank-rates.js
// "Банкны ханш" харьцуулах блок — Supabase bank_rates хүснэгтээс шууд уншина (public read RLS).
// index.html-д index.js/script.js-ийн ДАРАА, ЭЦСИЙН script tag-уудын нэг болгож холбоно:
//   <script src="supabase-client.js"></script>  (эхэлж ачаалагдсан байх ёстой, sb үүнд байна)
//   <script src="bank-rates.js"></script>

const BANK_ORDER = ["golomt", "khaan", "xac", "tdb", "mongolbank"];
const DEFAULT_CURRENCIES = ["USD", "EUR", "CNY", "RUB", "JPY", "KRW"];

async function loadBankRates() {
  const container = document.getElementById("bankRatesContainer");
  if (!container) return; // энэ блок хуудсанд байхгүй бол алгасна

  try {
    const { data, error } = await sb
      .from("bank_rates")
      .select("*")
      .order("currency", { ascending: true });

    if (error) throw error;
    renderBankRatesTable(container, data || []);
  } catch (err) {
    // Optional feature тул алдаа гарвал зөвхөн энэ блокоо нуух, бусад хуудсыг эвдэхгүй
    console.error("Банкны ханш ачаалахад алдаа гарлаа:", err);
    container.innerHTML =
      '<p class="bank-rates-error">Банкны ханшийн мэдээлэл түр ачаалагдсангүй.</p>';
  }
}

function renderBankRatesTable(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="bank-rates-error">Одоогоор ханшийн дата алга байна.</p>';
    return;
  }

  const banksPresent = BANK_ORDER.filter((b) => rows.some((r) => r.bank === b));
  const currencies = DEFAULT_CURRENCIES.filter((c) => rows.some((r) => r.currency === c));

  const byKey = {};
  rows.forEach((r) => {
    byKey[`${r.bank}__${r.currency}`] = r;
  });

  let html = '<div class="bank-rates-table-wrap"><table class="bank-rates-table">';
  html += "<thead><tr><th>Валют</th>";
  banksPresent.forEach((b) => {
    const label = rows.find((r) => r.bank === b)?.bank_name_mn || b;
    html += `<th colspan="2">${label}</th>`;
  });
  html += "</tr><tr><th></th>";
  banksPresent.forEach(() => {
    html += "<th>Авах</th><th>Зарах</th>";
  });
  html += "</tr></thead><tbody>";

  currencies.forEach((currency) => {
    html += `<tr><td class="bank-rates-currency">${currency}</td>`;
    // Тухайн валютаар хамгийн сайн (хамгийн бага) авах ханш, хамгийн сайн (хамгийн их) зарах ханшийг тодруулна
    const cellsForCurrency = banksPresent.map((b) => byKey[`${b}__${currency}`]);
    const buyValues = cellsForCurrency.map((c) => c?.buy_cash).filter((v) => v != null);
    const sellValues = cellsForCurrency.map((c) => c?.sell_cash).filter((v) => v != null);
    const bestBuy = buyValues.length ? Math.max(...buyValues) : null; // авах ханш өндөр байх нь хэрэглэгчид сайн
    const bestSell = sellValues.length ? Math.min(...sellValues) : null; // зарах ханш бага байх нь хэрэглэгчид сайн

    banksPresent.forEach((b) => {
      const cell = byKey[`${b}__${currency}`];
      const buy = cell?.buy_cash;
      const sell = cell?.sell_cash;
      const buyClass = buy != null && buy === bestBuy ? " bank-rates-best" : "";
      const sellClass = sell != null && sell === bestSell ? " bank-rates-best" : "";
      html += `<td class="${buyClass}">${buy != null ? formatRate(buy) : "—"}</td>`;
      html += `<td class="${sellClass}">${sell != null ? formatRate(sell) : "—"}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table></div>";

  const mongolbankRow = rows.find((r) => r.bank === "mongolbank");
  const updatedAt = rows
    .map((r) => r.updated_at)
    .sort()
    .pop();
  if (updatedAt) {
    const d = new Date(updatedAt);
    html += `<p class="bank-rates-updated">Сүүлд шинэчлэгдсэн: ${d.toLocaleString("mn-MN")}</p>`;
  }
  html +=
    '<p class="bank-rates-disclaimer">Энэхүү мэдээлэл нь лавлагааны зориулалттай, банкны бодит арилжааны ханш салбар/цахим сувгаас ялгаатай байж болно.</p>';

  container.innerHTML = html;
}

function formatRate(n) {
  return Number(n).toLocaleString("mn-MN", { maximumFractionDigits: 2 });
}

document.addEventListener("DOMContentLoaded", loadBankRates);
