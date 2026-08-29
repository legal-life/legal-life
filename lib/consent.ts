const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-2JXNJ9QJ9S";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean;
  }
}

export function initConsentDefaults() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string) {
  const nameEQ = name + "=";
  for (const c of document.cookie.split(";")) {
    const trimmed = c.trimStart();
    if (trimmed.startsWith(nameEQ)) return trimmed.slice(nameEQ.length);
  }
  return null;
}

function deleteGACookies() {
  const names = ["_ga", "_gid", "_gat", `_ga_${GA_MEASUREMENT_ID.replace("G-", "")}`];
  names.forEach((name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.${location.hostname}`;
  });
}

let gaLoaded = false;
function loadGoogleAnalytics() {
  if (gaLoaded) return;
  gaLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: "SameSite=Lax;Secure",
  });
}

export function grantConsent() {
  if (typeof window.gtag !== "function") initConsentDefaults();
  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
  });
  loadGoogleAnalytics();
}

export function denyConsent() {
  if (typeof window.gtag !== "function") initConsentDefaults();
  window.gtag("consent", "update", {
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
  });
  deleteGACookies();
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
}

export function acceptCookies() {
  setCookie("cookie_consent", "accepted", 365);
  grantConsent();
}

export function rejectCookies() {
  setCookie("cookie_consent", "rejected", 365);
  denyConsent();
}
