// ---------- Auth (Sign Up / Login / Logout) + Watchlist — Supabase-тэй холбогдоно ----------

let currentUser = null;
let currentProfile = null; // { trial_started_at, subscription_status }
const watchlistCache = new Map(); // ticker -> { id, asset_type }

// ---------- UI toggling: нэвтэрсэн эсэх ----------
function renderAuthState() {
  const loggedOut = document.getElementById("authActionsLoggedOut");
  const loggedIn = document.getElementById("authActionsLoggedIn");
  const emailLabel = document.getElementById("userEmailLabel");
  if (!loggedOut || !loggedIn) return;

  if (currentUser) {
    loggedOut.style.display = "none";
    loggedIn.style.display = "flex";
    if (emailLabel) emailLabel.textContent = currentUser.email;
  } else {
    loggedOut.style.display = "flex";
    loggedIn.style.display = "none";
  }
  renderUpgradeBtnFromProfile();
}

// ---------- Trial/Subscription badge-ийг бодит profile дата дээр үндэслэж шинэчлэх ----------
const TRIAL_TOTAL_DAYS = 2;

function renderUpgradeBtnFromProfile() {
  const btn = document.getElementById("upgradeBtn");
  if (!btn) return;

  if (!currentUser || !currentProfile) {
    // Нэвтрээгүй байхад — жинхэнэ trial зөвхөн бүртгүүлсний дараа эхэлдэг тул анги "жишээ" харуулна
    btn.textContent = t("trial_badge")(TRIAL_TOTAL_DAYS);
    return;
  }

  if (currentProfile.subscription_status === "active") {
    btn.textContent = t("subscribed_badge");
    return;
  }

  const startedAt = new Date(currentProfile.trial_started_at);
  const daysUsed = Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(TRIAL_TOTAL_DAYS - daysUsed, 0);

  if (daysLeft <= 0) {
    btn.textContent = t("trial_expired_badge");
  } else {
    btn.textContent = t("trial_badge")(daysLeft);
  }
}

// ---------- Profile-г Supabase-с татах ----------
async function loadProfile() {
  if (!currentUser || !sb) return;
  const { data, error } = await sb
    .from("profiles")
    .select("trial_started_at, subscription_status")
    .eq("id", currentUser.id)
    .single();
  if (!error && data) currentProfile = data;
  renderUpgradeBtnFromProfile();
}

// ---------- Watchlist-ийн бүх мөрийг татаж cache-д хийх ----------
async function loadWatchlistCache() {
  watchlistCache.clear();
  if (!currentUser || !sb) return;
  const { data, error } = await sb
    .from("watchlist")
    .select("id, ticker, asset_type")
    .eq("user_id", currentUser.id);
  if (!error && data) {
    data.forEach(row => watchlistCache.set(row.ticker, { id: row.id, asset_type: row.asset_type }));
  }
  // Одоо нээлттэй байгаа asset card дээрх ⭐ icon-г шинэчилнэ
  document.querySelectorAll(".watch-star").forEach(refreshStarEl);
}

function refreshStarEl(el) {
  const ticker = el.dataset.ticker;
  el.classList.toggle("active", watchlistCache.has(ticker));
  el.textContent = watchlistCache.has(ticker) ? "★" : "☆";
}

function wireWatchStar(ticker, assetType) {
  const starEl = document.querySelector(`.watch-star[data-ticker="${ticker}"]`);
  if (!starEl) return;
  refreshStarEl(starEl);
  starEl.addEventListener("click", () => toggleWatchlist(ticker, assetType, starEl));
}

// ---------- ⭐ товч дарахад Watchlist-д нэмэх/хасах ----------
async function toggleWatchlist(ticker, assetType, starEl) {
  if (!currentUser) {
    openAuthModal("login");
    return;
  }
  if (!sb) return;

  if (watchlistCache.has(ticker)) {
    const { id } = watchlistCache.get(ticker);
    const { error } = await sb.from("watchlist").delete().eq("id", id);
    if (!error) watchlistCache.delete(ticker);
  } else {
    const { data, error } = await sb
      .from("watchlist")
      .insert({ user_id: currentUser.id, ticker, asset_type: assetType })
      .select()
      .single();
    if (!error && data) watchlistCache.set(ticker, { id: data.id, asset_type: assetType });
  }
  if (starEl) refreshStarEl(starEl);
}

// ---------- "Хяналтын жагсаалт" nav дарахад харуулах хэсэг ----------
async function renderWatchlistView() {
  if (!currentUser) {
    openAuthModal("login");
    return;
  }
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = `<div class="loading">${t("loading")}</div>`;

  const { data, error } = await sb
    .from("watchlist")
    .select("ticker, asset_type, added_at")
    .eq("user_id", currentUser.id)
    .order("added_at", { ascending: false });

  if (error || !data || !data.length) {
    resultArea.innerHTML = `<div class="empty-state"><p>${t("watchlist_empty")}</p></div>`;
    return;
  }

  resultArea.innerHTML = `
    <div class="watchlist-view">
      <div class="watchlist-heading">${t("nav_watchlist")}</div>
      ${data.map(row => {
        const asset = ASSET_DB.find(a => a.ticker === row.ticker);
        const label = asset ? asset.names[0] : "";
        return `<button class="watchlist-row" data-ticker="${row.ticker}">
          <span class="watchlist-row-ticker">${row.ticker}</span>
          <span class="watchlist-row-name">${label}</span>
          <span class="watchlist-row-type">${row.asset_type === "crypto" ? t("type_crypto") : t("type_stock")}</span>
        </button>`;
      }).join("")}
    </div>`;

  resultArea.querySelectorAll(".watchlist-row").forEach(row => {
    row.addEventListener("click", () => {
      document.getElementById("navTerminal")?.classList.add("active");
      document.getElementById("navWatchlist")?.classList.remove("active");
      runSearch(row.dataset.ticker);
    });
  });
}

// ---------- Nav холбоосууд ----------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("navWatchlist")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("navWatchlist")?.classList.add("active");
    document.getElementById("navTerminal")?.classList.remove("active");
    renderWatchlistView();
  });
  document.getElementById("navTerminal")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("navTerminal")?.classList.add("active");
    document.getElementById("navWatchlist")?.classList.remove("active");
    location.reload(); // энгийн шийдэл — терминал view-г цэвэрхэн дахин ачаална
  });
});

// ---------- Auth modal (Sign Up / Login) ----------
let authModalMode = "login";

function openAuthModal(mode) {
  authModalMode = mode;
  const overlay = document.getElementById("authModalOverlay");
  overlay.classList.add("show");
  document.getElementById("authError").textContent = "";
  document.getElementById("authSuccess").textContent = "";
  updateAuthModalMode();
}

function closeAuthModal() {
  document.getElementById("authModalOverlay")?.classList.remove("show");
}

function updateAuthModalMode() {
  const isLogin = authModalMode === "login";
  document.getElementById("tabLogin")?.classList.toggle("active", isLogin);
  document.getElementById("tabSignup")?.classList.toggle("active", !isLogin);
  const submitBtn = document.getElementById("authSubmitBtn");
  if (submitBtn) submitBtn.textContent = isLogin ? t("btn_login") : t("btn_signup");
  document.getElementById("authError").textContent = "";
  document.getElementById("authSuccess").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn")?.addEventListener("click", () => openAuthModal("login"));
  document.getElementById("signupBtn")?.addEventListener("click", () => openAuthModal("signup"));
  document.getElementById("authModalClose")?.addEventListener("click", closeAuthModal);
  document.getElementById("authModalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "authModalOverlay") closeAuthModal();
  });
  document.getElementById("tabLogin")?.addEventListener("click", () => { authModalMode = "login"; updateAuthModalMode(); });
  document.getElementById("tabSignup")?.addEventListener("click", () => { authModalMode = "signup"; updateAuthModalMode(); });

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await sb.auth.signOut();
  });

  document.getElementById("authForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!sb) return;
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errorEl = document.getElementById("authError");
    const successEl = document.getElementById("authSuccess");
    errorEl.textContent = "";
    successEl.textContent = "";

    if (authModalMode === "signup") {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        if (/already registered|already exists/i.test(error.message)) {
          errorEl.textContent = t("auth_error_already_registered");
        } else {
          errorEl.textContent = error.message;
        }
        return;
      }
      if (data.user && !data.session) {
        // Supabase анхдагч тохиргоогоор имэйл баталгаажуулалт шаарддаг
        successEl.textContent = t("auth_confirm_email_sent");
        return;
      }
      closeAuthModal();
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (/email not confirmed/i.test(error.message)) {
          showUnconfirmedEmailPrompt(email);
        } else if (/invalid login credentials/i.test(error.message)) {
          errorEl.textContent = t("auth_error_invalid_credentials");
        } else {
          errorEl.textContent = error.message;
        }
        return;
      }
      closeAuthModal();
    }
  });
});

// ---------- "Email not confirmed" тохиолдолд ойлгомжтой мессеж + дахин илгээх товч ----------
function showUnconfirmedEmailPrompt(email) {
  const errorEl = document.getElementById("authError");
  errorEl.innerHTML = `${t("auth_error_unconfirmed")} <button type="button" id="resendConfirmBtn" class="modal-inline-link">${t("auth_resend_link")}</button>`;
  document.getElementById("resendConfirmBtn")?.addEventListener("click", async () => {
    const successEl = document.getElementById("authSuccess");
    errorEl.textContent = "";
    const { error } = await sb.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    successEl.textContent = error ? error.message : t("auth_confirm_email_sent");
  });
}

// ---------- Supabase session өөрчлөгдөх бүрд UI-г шинэчлэх ----------
if (sb) {
  sb.auth.onAuthStateChange((_event, session) => {
    const wasLoggedOut = !currentUser;
    currentUser = session?.user ?? null;
    currentProfile = null;
    renderAuthState();
    if (currentUser) {
      loadProfile();
      loadWatchlistCache();
      // Имэйл баталгаажуулах холбоосоор буцаж ирэхэд modal нээлттэй үлдсэн байвал хаана
      if (wasLoggedOut) closeAuthModal();
    } else {
      watchlistCache.clear();
    }
  });

  // Хуудас ачаалахад аль хэдийн нэвтэрсэн session байгаа эсэхийг шалгана
  sb.auth.getSession().then(({ data }) => {
    currentUser = data?.session?.user ?? null;
    renderAuthState();
    if (currentUser) {
      loadProfile();
      loadWatchlistCache();
    }
  });
}
