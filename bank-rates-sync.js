// api/bank-rates-sync.js
// Эх сурвалж: https://gogo.mn/exchange
// Энэ нэг хуудсан дээр Монголбанкны албан ханш + 8 банк/газрын ханшийг
// server-rendered HTML хэлбэрээр өгдөг тул headless browser шаардлагагүй.
//
// Vercel Environment Variables:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY шаардлагатай.
//   CRON_SECRET (заавал биш) — байвал Authorization header шалгана.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

// gogo.mn/exchange хуудсан дэх хүснэгтүүдийн дараалал (tab-уудын дараалалтай тохирно).
// 1-р хүснэгт (Монгол банк) нь ганц баганатай (Зарласан ханш),
// үлдсэн нь Авах/Зарах гэсэн 2 баганатай.
const BANK_TABLES = [
  { key: "mongolbank", name_mn: "Монголбанк (албан ханш)", singleColumn: true },
  { key: "golomt", name_mn: "Голомт Банк", singleColumn: false },
  { key: "tdb", name_mn: "ХХБанк (ХХБ)", singleColumn: false },
  { key: "khaan", name_mn: "ХААН Банк", singleColumn: false },
  { key: "capitron", name_mn: "Капитрон Банк", singleColumn: false },
  { key: "state", name_mn: "Төрийн Банк", singleColumn: false },
  { key: "uurgach", name_mn: "Уран Уургач", singleColumn: false },
  { key: "euroasia", name_mn: "Евро Ази", singleColumn: false },
  { key: "nomin_unity", name_mn: "Номин Юнити ББСБ", singleColumn: false },
];

const KNOWN_CODES = new Set([
  "USD", "EUR", "GBP", "RUB", "CNY", "JPY", "KRW", "CAD", "NZD", "AUD",
  "HKD", "SGD", "CHF", "SEK", "XAU", "XAG", "INR", "CZK", "THB", "KZT",
  "TWD", "MYR", "HUF", "BGN", "EGP", "KPW", "IDR", "KWD", "SDR",
]);

function stripTags(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Нэг <td>-ийн текстээс ЗӨВХӨН эхний тоог авна (жишээ "4,053.00 3.00" -> 4053.00),
// учир нь хоёр дахь тоо нь өдрийн өөрчлөлт (+/-) байдаг, ханш биш.
function parseFirstNumber(text) {
  const match = text.match(/-?[\d,]+\.?\d*/);
  if (!match) return null;
  const cleaned = match[0].replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function parseTable(tableHtml, singleColumn) {
  const rowMatches = [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const rows = [];

  for (const rowMatch of rowMatches) {
    const cellMatches = [...rowMatch[0].matchAll(/<td[\s\S]*?<\/td>/gi)];
    if (!cellMatches.length) continue;

    const cellTexts = cellMatches.map((c) => stripTags(c[0]));

    // Валютын кодыг агуулсан нүдийг олно (жишээ "USD АНУ-ын доллар ...")
    const codeIdx = cellTexts.findIndex((t) => {
      const m = t.match(/\b([A-Z]{3})\b/);
      return m && KNOWN_CODES.has(m[1]);
    });
    if (codeIdx === -1) continue;

    const codeMatch = cellTexts[codeIdx].match(/\b([A-Z]{3})\b/);
    const code = codeMatch[1];

    const afterCells = cellTexts.slice(codeIdx + 1);
    if (!afterCells.length) continue;

    if (singleColumn) {
      const official = parseFirstNumber(afterCells[0]);
      if (official === null) continue;
      rows.push({ currency: code, official, buy_cash: null, sell_cash: null });
    } else {
      const buy = parseFirstNumber(afterCells[0]);
      const sell = afterCells.length > 1 ? parseFirstNumber(afterCells[1]) : null;
      if (buy === null && sell === null) continue;
      rows.push({ currency: code, buy_cash: buy, sell_cash: sell, official: null });
    }
  }

  return rows;
}

async function getGogoBankRates() {
  const res = await fetch("https://gogo.mn/exchange", { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`gogo.mn -> HTTP ${res.status}`);
  const html = await res.text();

  const tableMatches = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];

  // Валютын код агуулсан (жинхэнэ ханшийн) хүснэгтүүдийг л шүүнэ, нэгтгэсэн
  // "Ханш харьцуулалт" мэт давхардсан хүснэгтийг оруулахгүйн тулд эхний N-ийг л авна
  const rateTables = tableMatches.filter((m) => /USD|EUR|CNY/.test(stripTags(m[0])));

  if (!rateTables.length) {
    throw new Error("gogo.mn: ханшийн хүснэгт олдсонгүй — хуудасны бүтэц өөрчлөгдсөн байж магадгүй");
  }

  const allRows = [];
  const perBankResult = {};

  BANK_TABLES.forEach((bank, idx) => {
    const tableMatch = rateTables[idx];
    if (!tableMatch) {
      perBankResult[bank.key] = { ok: false, error: "тохирох хүснэгт олдсонгүй (индекс дутуу)" };
      return;
    }
    try {
      const rows = parseTable(tableMatch[0], bank.singleColumn);
      if (!rows.length) {
        perBankResult[bank.key] = { ok: false, error: "хүснэгтэд мөр задарсангүй" };
        return;
      }
      rows.forEach((r) => {
        allRows.push({
          bank: bank.key,
          bank_name_mn: bank.name_mn,
          currency: r.currency,
          buy_cash: r.buy_cash,
          sell_cash: r.sell_cash,
          buy_noncash: null,
          sell_noncash: null,
          official: r.official,
        });
      });
      perBankResult[bank.key] = { ok: true, count: rows.length };
    } catch (err) {
      perBankResult[bank.key] = { ok: false, error: String(err.message || err) };
    }
  });

  return { rows: allRows, perBankResult };
}

async function upsertToSupabase(rows) {
  if (!rows.length) return { inserted: 0 };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/bank_rates?on_conflict=bank,currency`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }))),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert алдаа (${res.status}): ${text}`);
  }
  return { inserted: rows.length };
}

module.exports = async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "SUPABASE_URL эсвэл SUPABASE_SERVICE_ROLE_KEY тохируулаагүй байна" });
    return;
  }

  try {
    const { rows, perBankResult } = await getGogoBankRates();
    const upsertResult = await upsertToSupabase(rows);
    res.status(200).json({ ok: true, source: "gogo.mn/exchange", sources: perBankResult, ...upsertResult });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
};
