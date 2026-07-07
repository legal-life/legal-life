// cookie.js — Google Consent Mode v2 対応版
// 測定ID = 'G-2JXNJ9QJ9S'

const GA_MEASUREMENT_ID = "G-2JXNJ9QJ9S";

// ========================================
// Step 1: デフォルト同意状態を最速で宣言
//   ※ gtag スクリプトよりも前に実行される必要がある
//   ※ cookie.js は <head> 内の gtag より後に読まれるが、
//      gtag 自体の consent 設定はこのファイルで行う
// ========================================
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

// Consent Mode v2: デフォルトはすべて denied
gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "granted", // セキュリティ用は常時許可
  wait_for_update: 500, // バナー表示まで 500ms 待機
});

// ========================================
// Cookie 操作
// ========================================
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  for (const c of document.cookie.split(";")) {
    const trimmed = c.trimStart();
    if (trimmed.startsWith(nameEQ)) return trimmed.slice(nameEQ.length);
  }
  return null;
}

function deleteGACookies() {
  const names = [
    "_ga",
    "_gid",
    "_gat",
    `_ga_${GA_MEASUREMENT_ID.replace("G-", "")}`,
  ];
  names.forEach((name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${location.hostname}`;
  });
}

// ========================================
// Google Analytics の動的ロード
// ========================================
let _gaLoaded = false;

function loadGoogleAnalytics() {
  if (_gaLoaded) return;
  _gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: "SameSite=Lax;Secure",
  });
  console.log("📊 Google Analytics: 読み込み完了");
}

// ========================================
// Consent Mode v2: 同意の更新
// ========================================
function grantConsent() {
  gtag("consent", "update", {
    ad_storage: "denied", // 広告は利用しないため常時 denied
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
  });
  loadGoogleAnalytics();
  console.log("✅ Consent Mode v2: analytics_storage を granted に更新");
}

function denyConsent() {
  gtag("consent", "update", {
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
  });
  // GA の Cookie を削除
  deleteGACookies();
  // 既にロードされたスクリプトの計測を停止
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  console.log("❌ Consent Mode v2: analytics_storage を denied に更新");
}

// ========================================
// バナー制御
// ========================================
function showBanner(banner) {
  setTimeout(() => banner.classList.add("is-show"), 500);
}

function hideBanner(banner) {
  banner.classList.remove("is-show");
}

function handleAccept(banner) {
  setCookie("cookie_consent", "accepted", 365);
  hideBanner(banner);
  grantConsent();
}

function handleReject(banner) {
  setCookie("cookie_consent", "rejected", 365);
  hideBanner(banner);
  denyConsent();
}

// ========================================
// 初期化
// ========================================
function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");

  if (!banner) {
    console.warn("⚠️ Cookie バナー要素が見つかりません");
    return;
  }

  const consent = getCookie("cookie_consent");
  console.log("🔍 Cookie 同意状態:", consent || "未設定");

  if (!consent) {
    showBanner(banner);
  } else if (consent === "accepted") {
    grantConsent();
  } else {
    denyConsent();
  }

  acceptBtn?.addEventListener("click", () => handleAccept(banner));
  rejectBtn?.addEventListener("click", () => handleReject(banner));
}

// footer.html に #cookie-banner が注入されてから実行
function initWithRetry(attempt = 0) {
  const banner = document.getElementById("cookie-banner");
  if (banner) {
    initCookieBanner();
  } else if (attempt < 30) {
    setTimeout(() => initWithRetry(attempt + 1), 100);
  } else {
    console.error("❌ cookie.js: バナー要素が見つかりませんでした");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initWithRetry());
} else {
  initWithRetry();
}

console.log("🍪 cookie.js: Consent Mode v2 対応版 読み込み完了");
