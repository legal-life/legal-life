// ブラウザ/OS/位置情報の判定ロジック。以前は lib/auth/utils.ts・lib/deviceInfo.ts・
// components/AccessLogger.tsx の3箇所にほぼ同一の実装が重複しており、ラベル表記が
// 微妙に食い違っていた(例: "Chrome" vs "Google Chrome")。ここに一本化する。

export type UAInfo = { browser: string; os: string; device: string };

export function parseUA(): UAInfo {
  const ua = navigator.userAgent;
  let browser = "その他";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Google Chrome";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "その他";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? "スマートフォン/タブレット" : "PC";
  return { browser, os, device };
}

export type LocationInfo = { country: string; region: string; city: string; ip: string };

const UNKNOWN_LOCATION: LocationInfo = { country: "不明", region: "不明", city: "不明", ip: "不明" };

export async function fetchLocation(): Promise<LocationInfo> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("https://ipapi.co/json", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      if (d?.country_name) {
        return { country: d.country_name || "不明", region: d.region || "不明", city: d.city || "不明", ip: d.ip || "不明" };
      }
    }
  } catch {
    /* ignore, fall through to secondary source */
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch("https://cloudflare.com/cdn-cgi/trace", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const text = await res.text();
      const loc = text.match(/loc=([A-Z]{2})/)?.[1];
      const ip = text.match(/ip=([^\n]+)/)?.[1];
      if (loc) return { country: loc, region: "不明", city: "不明", ip: ip || "不明" };
    }
  } catch {
    /* both failed */
  }

  return UNKNOWN_LOCATION;
}
