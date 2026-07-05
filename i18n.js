// ---------- Хэл сонголт (MN / EN) ----------
// Монгол хэл DEFAULT — сайт зорилтот үзэгчидтэйгээ (Монголчууд) яг ямар хэлээр анх
// уулзахыг сонгодогтой ижил учир localStorage-д хадгалсан сонголт байхгүй бол
// browser-ийн хэл ямар ч байсан МОНГОЛ хэлээр эхэлнэ.

const I18N = {
  mn: {
    page_title: "Зоос — Хувьцаа, крипто мэдээллийн терминал",
    nav_terminal: "Терминал",
    nav_news: "Мэдээ",
    nav_watchlist: "Хяналтын жагсаалт",
    btn_login: "Нэвтрэх",
    btn_signup: "Бүртгүүлэх",
    btn_logout: "Гарах",
    auth_email_label: "Имэйл",
    auth_password_label: "Нууц үг",
    auth_confirm_email_sent: "Баталгаажуулах холбоос имэйл рүү илгээгдлээ. Инбоксоо шалгаарай.",
    subscribed_badge: "Багц идэвхтэй ✓",
    trial_expired_badge: "Trial дууссан — багц авах",
    watchlist_empty: "Watchlist хоосон байна — ⭐ товч дарж ticker нэмээрэй.",
    hero_pre: "Зах зээлийг ",
    hero_accent: "эх хэлээрээ",
    hero_post: " уншина",
    eyebrow: "Ticker эсвэл нэрээр хайх — жишээ: AAPL, Apple, Bitcoin, BTC, Tesla",
    search_placeholder: "Хайх...",
    indices_heading: "Дэлхийн зах зээл",
    index_hk: "Хонг Конг",
    index_jp: "Япон (Tokyo)",
    indices_note: "* Индексийг хамгийн ойр дагадаг ETF-ээр илэрхийлсэн (шууд индексийн key шаардахгүй)",
    empty_state: "Дээрх талбарт ticker буюу компанийн нэрээ бичээд хайлт хийнэ үү.",
    footer_text: "© 2026 Зоос — Монгол хэл дээрх санхүүгийн терминал",
    trial_badge: (days) => `Trial: ${days} өдөр үлдлээ`,
    type_crypto: "Крипто",
    type_stock: "Хувьцаа",
    loading: "Мэдээлэл татаж байна...",
    tape_loading_error: "Мэдээлэл татахад алдаа гарлаа — интернэт холболтоо шалгана уу.",
    index_error: "алдаа",
    error_state: "Мэдээлэл татахад алдаа гарлаа. Дахин оролдоно уу.",
    stablecoin_notice: "Энэ хөрөнгө нь ам.доллартай босоо тогтвортой ханшийг (stablecoin) баримталдаг тул график шаардлагагүй.",
    stat_market_cap: "Койны нийт үнэ (бүх ширхэг × ханш)",
    stat_volume_24h: "24 цагийн худалдааны хэмжээ",
    stat_week_high: "7 хоногийн дээд",
    stat_week_low: "7 хоногийн доод",
    stat_open: "Нээлтийн үнэ",
    stat_day_high: "Өдрийн дээд",
    stat_day_low: "Өдрийн доод",
    stat_prev_close: "Өмнөх хаалт",
    chg_24h_suffix: "(сүүлийн 24 цагт)",
    chg_today_suffix: "(өдрийн)",
    news_title: "Холбогдох мэдээ",
    news_loading: "Мэдээ ачаалж байна...",
    news_empty: "Одоогоор энэ ticker-тэй холбоотой шинэ мэдээ олдсонгүй.",
    news_error: "Мэдээ татахад алдаа гарлаа.",
    news_footnote: "* Эх сурвалж: Finnhub / CryptoCompare — Монгол орчуулга автоматаар хийгдсэн.",
    news_footnote_en: "* Эх сурвалж: Finnhub / CryptoCompare (эх хэл — Англи).",
    signup_placeholder: "Энд бүртгэлийн хуудас руу шилжих холбоос орно.",
    login_placeholder: "Энд нэвтрэх хуудас руу шилжих холбоос орно.",
    upgrade_placeholder: "Энд Stripe/Payment хуудас руу шилжих холбоос орно.",
  },
  en: {
    page_title: "Zoos — Stock & Crypto Terminal",
    nav_terminal: "Terminal",
    nav_news: "News",
    nav_watchlist: "Watchlist",
    btn_login: "Log In",
    btn_signup: "Sign Up",
    btn_logout: "Log Out",
    auth_email_label: "Email",
    auth_password_label: "Password",
    auth_confirm_email_sent: "A confirmation link was sent to your email. Please check your inbox.",
    subscribed_badge: "Subscribed ✓",
    trial_expired_badge: "Trial ended — subscribe",
    watchlist_empty: "Your watchlist is empty — tap ⭐ on any asset to add it.",
    hero_pre: "Read the market ",
    hero_accent: "in real time",
    hero_post: "",
    eyebrow: "Search by ticker or name — e.g. AAPL, Apple, Bitcoin, BTC, Tesla",
    search_placeholder: "Search...",
    indices_heading: "Global Markets",
    index_hk: "Hong Kong",
    index_jp: "Japan (Tokyo)",
    indices_note: "* Indices are represented by their closest-tracking ETF (no direct index key required)",
    empty_state: "Type a ticker or company name above to search.",
    footer_text: "© 2026 Zoos — a Mongolian-built financial terminal",
    trial_badge: (days) => `Trial: ${days} day${days === 1 ? "" : "s"} left`,
    type_crypto: "Crypto",
    type_stock: "Stock",
    loading: "Loading data...",
    tape_loading_error: "Failed to load data — please check your connection.",
    index_error: "error",
    error_state: "Failed to load data. Please try again.",
    stablecoin_notice: "This asset tracks the US dollar (stablecoin), so a price chart isn't meaningful here.",
    stat_market_cap: "Market cap (price × circulating supply)",
    stat_volume_24h: "24h trading volume",
    stat_week_high: "7-day high",
    stat_week_low: "7-day low",
    stat_open: "Open",
    stat_day_high: "Day high",
    stat_day_low: "Day low",
    stat_prev_close: "Previous close",
    chg_24h_suffix: "(last 24h)",
    chg_today_suffix: "(today)",
    news_title: "Related News",
    news_loading: "Loading news...",
    news_empty: "No recent news found for this ticker.",
    news_error: "Failed to load news.",
    news_footnote: "* Source: Finnhub / CryptoCompare.",
    news_footnote_en: "* Source: Finnhub / CryptoCompare.",
    signup_placeholder: "This would link to the sign-up page.",
    login_placeholder: "This would link to the log-in page.",
    upgrade_placeholder: "This would link to the Stripe/payment page.",
  },
};

const SUPPORTED_LANGS = ["mn", "en"];
const LANG_STORAGE_KEY = "zoos_lang";

function getLang() {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return SUPPORTED_LANGS.includes(saved) ? saved : "mn"; // Монгол хэл ЭХЭЭР — browser locale-с үл хамааран
}

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) ?? I18N.mn[key] ?? key;
}

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  applyStaticTranslations();
  if (typeof onLanguageChanged === "function") onLanguageChanged(lang);
}

function applyStaticTranslations() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t("page_title");
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  const langCodeEl = document.getElementById("langCode");
  if (langCodeEl) langCodeEl.textContent = lang.toUpperCase();
  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

// ---------- Хэлний dropdown цэсний харагдац ----------
document.addEventListener("DOMContentLoaded", () => {
  applyStaticTranslations();

  const langBtn = document.getElementById("langBtn");
  const langMenu = document.getElementById("langMenu");
  const langSwitcher = document.getElementById("langSwitcher");

  langBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = langMenu.classList.toggle("show");
    langBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      langMenu.classList.remove("show");
      langBtn.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (langSwitcher && !langSwitcher.contains(e.target)) {
      langMenu?.classList.remove("show");
      langBtn?.setAttribute("aria-expanded", "false");
    }
  });
});
