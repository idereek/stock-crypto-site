// api/bank-rates-sync.js
// Vercel Cron энэ endpoint-ийг өдөрт 2 удаа (09:00 ба 18:00 УБ цагаар) дуудна.
// CommonJS ашиглана (package.json байхгүй тул export default АЖИЛЛАХГҮЙ).
//
// Шаардлагатай Vercel Environment Variables:
//   SUPABASE_URL                — https://gbjwxuvrkuopfcrnxwvs.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — Supabase Dashboard → Settings → API → service_role key
//                                  (АНХААР: энэ key-г ЭНГИЙН client файлд хэзээ ч бичиж болохгүй,
//                                   зөвхөн server-талын Environment Variable-д л байрлана)
//   CRON_SECRET                 — санамсаргүй урт тэмдэгтийн мөр, зөвхөн Vercel Cron дуудахад ашиглана

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

const RATE_ID_TO_CODE = {
  3: "USD",
  4: "EUR",
  5: "CNY",
  6: "RUB",
  7: "JPY",
  8: "GBP",
  9: "CHF",
  11: "KRW",
  12: "HKD",
  13: "AUD",
  14: "CAD",
  15: "SGD",
  16: "SEK",
};

async function fetchJson(url, opts) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, ...opts });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url, opts) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, ...opts });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

// ---------- Монголбанк (албан ханш, baseline) ----------
async function getMongolbankRates() {
  const json = await fetchJson("https://www.mongolbank.mn/mn/currency-rates-json"); // fallback endpoint — эх сайт бүтэц өөрчлөгдсөн бол доорх try/catch алдаа барина
  // Тодорхойгүй бүтэц тул хамгаалалттайгаар boолож үзнэ:
  const list = Array.isArray(json) ? json : json?.data || json?.rates || [];
  return list
    .map((item) => ({
      currency: item.code || item.currency,
      official: parseFloat(item.rate || item.value || item.rate_float),
    }))
    .filter((r) => r.currency && !Number.isNaN(r.official))
    .map((r) => ({
      bank: "mongolbank",
      bank_name_mn: "Монголбанк (албан ханш)",
      currency: r.currency,
      buy_cash: null,
      sell_cash: null,
      buy_noncash: null,
      sell_noncash: null,
      official: r.official,
    }));
}

// ---------- Голомт банк ----------
async function getGolomtRates() {
  const json = await fetchJson(
    "https://www.golomtbank.com/mn/home/ratesForSites/rate.json"
  );
  const rates = json?.rates || [];
  return rates
    .map((r) => {
      // Талбарын нэрс он оны туршид өөрчлөгдсөн байж болзошгүй тул
      // хэд хэдэн боломжит түлхүүрийг туршина
      const idField = Object.keys(r).find((k) => k.startsWith("rate_id"));
      const officialField = Object.keys(r).find((k) => k.startsWith("mongol_b"));
      const cashBuyField = Object.keys(r).find((k) => k.startsWith("cash_buy"));
      const cashSellField = Object.keys(r).find((k) => k.startsWith("cash_sel"));
      const nonCashBuyField = Object.keys(r).find((k) => k.startsWith("non_cash6"));
      const nonCashSellField = Object.keys(r).find((k) => k.startsWith("non_cash7"));

      const code = RATE_ID_TO_CODE[r[idField]];
      if (!code) return null;

      return {
        bank: "golomt",
        bank_name_mn: "Голомт банк",
        currency: code,
        buy_cash: parseFloat(r[cashBuyField]) || null,
        sell_cash: parseFloat(r[cashSellField]) || null,
        buy_noncash: parseFloat(r[nonCashBuyField]) || null,
        sell_noncash: parseFloat(r[nonCashSellField]) || null,
        official: parseFloat(r[officialField]) || null,
      };
    })
    .filter(Boolean);
}

// ---------- Хаан банк ----------
async function getKhaanRates() {
  const json = await fetchJson(
    "https://kbknew.khanbank.com/api/site/home?lang=mn&site=personal"
  );
  const list = json?.data?.currencies?.today || [];
  return list.map((r) => ({
    bank: "khaan",
    bank_name_mn: "Хаан банк",
    currency: r.code,
    buy_cash: parseFloat(r.buy_cash) || null,
    sell_cash: parseFloat(r.sell_cash) || null,
    buy_noncash: parseFloat(r.buy) || null,
    sell_noncash: parseFloat(r.sell) || null,
    official: parseFloat(r.alban) || null,
  }));
}

// ---------- ХасБанк (HTML доторх <script> JSON-г salгах) ----------
async function getXacRates() {
  const html = await fetchText("https://www.xacbank.mn/calculator/rates");
  const match = html.match(/var\s+weekRates\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error("xacbank: weekRates script блок олдсонгүй — хуудасны бүтэц өөрчлөгдсөн байж магадгүй");
  const weekRates = JSON.parse(match[1]);
  // weekRates[i] бол өдөр тус бүрийн массив; сүүлчийн (хамгийн сүүлийн үеийн) өдрийг авна
  const latestDay = weekRates[weekRates.length - 1];
  if (!Array.isArray(latestDay)) throw new Error("xacbank: хүлээгдээгүй өгөгдлийн бүтэц");
  return latestDay.map((r) => ({
    bank: "xac",
    bank_name_mn: "ХасБанк",
    currency: r.code,
    buy_cash: parseFloat(r.buy_cash) || null,
    sell_cash: parseFloat(r.sell_cash) || null,
    buy_noncash: parseFloat(r.buy) || null,
    sell_noncash: parseFloat(r.sell) || null,
    official: parseFloat(r.alban) || null,
  }));
}

// ---------- ХХБанк / TDB (HTML хүснэгт scrape) ----------
async function getTdbRates() {
  const html = await fetchText("http://www.tdbm.mn/script.php?mod=rate&ln=mn");
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) throw new Error("tdb: хүснэгт олдсонгүй");
  const rows = [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const results = [];
  rows.forEach((rowMatch, idx) => {
    if (idx <= 2) return; // эхний 3 мөр толгой (header) байдаг
    const row = rowMatch[0];
    const cells = [...row.matchAll(/<td[\s\S]*?<\/td>/gi)].map((c) => c[0]);
    if (cells.length < 5) return;
    const srcMatch = cells[0].match(/src="([^"]+)"/i);
    if (!srcMatch) return;
    const filename = srcMatch[1].split("/").pop() || "";
    const code = (filename.split(".")[0] || "").toUpperCase();
    const stripTags = (s) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
    if (!code) return;
    results.push({
      bank: "tdb",
      bank_name_mn: "ХХБанк (TDB)",
      currency: code,
      buy_cash: parseFloat(stripTags(cells[1])) || null,
      sell_cash: parseFloat(stripTags(cells[2])) || null,
      buy_noncash: parseFloat(stripTags(cells[3])) || null,
      sell_noncash: parseFloat(stripTags(cells[4])) || null,
      official: null,
    });
  });
  return results;
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
    body: JSON.stringify(
      rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }))
    ),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert алдаа (${res.status}): ${text}`);
  }
  return { inserted: rows.length };
}

module.exports = async function handler(req, res) {
  // Аюулгүй байдал: Vercel Cron болон гараар тестлэхэд CRON_SECRET шалгана
  const authHeader = req.headers["authorization"];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ error: "SUPABASE_URL эсвэл SUPABASE_SERVICE_ROLE_KEY тохируулаагүй байна" });
    return;
  }

  // Банк тус бүрийг тусад нь try/catch-д хийнэ — нэг банк унавал бусад нь ажиллаж үлдэнэ
  // (README-д тэмдэглэсэн сургамж #11-тэй адил зарчим)
  const sources = [
    { name: "mongolbank", fn: getMongolbankRates },
    { name: "golomt", fn: getGolomtRates },
    { name: "khaan", fn: getKhaanRates },
    { name: "xac", fn: getXacRates },
    { name: "tdb", fn: getTdbRates },
  ];

  const results = {};
  const allRows = [];

  for (const src of sources) {
    try {
      const rows = await src.fn();
      results[src.name] = { ok: true, count: rows.length };
      allRows.push(...rows);
    } catch (err) {
      results[src.name] = { ok: false, error: String(err.message || err) };
    }
  }

  try {
    const upsertResult = await upsertToSupabase(allRows);
    res.status(200).json({ ok: true, sources: results, ...upsertResult });
  } catch (err) {
    res.status(500).json({ ok: false, sources: results, error: String(err.message || err) });
  }
};
