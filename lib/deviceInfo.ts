function parseUA() {
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

async function fetchLocation(): Promise<{ country: string; region: string; city: string; ip: string }> {
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
    /* ignore */
  }

  return { country: "不明", region: "不明", city: "不明", ip: "不明" };
}

export async function collectDeviceInfo() {
  const ua = parseUA();
  const loc = await fetchLocation();

  const nav = navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } };
  const conn = nav.connection;
  const networkType = conn ? `${conn.effectiveType ?? "不明"}${conn.downlink ? ` (${conn.downlink}Mbps)` : ""}` : "取得不可";

  let storageUsage = "取得不可";
  try {
    storageUsage = `${(encodeURI(JSON.stringify(localStorage)).length / 1024).toFixed(2)} KB`;
  } catch {
    /* ignore */
  }

  let memoryUsage = "取得不可 (Chrome以外)";
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
  if (perf.memory) {
    memoryUsage = `${Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)} MB`;
  }

  return {
    device_browser: ua.browser,
    device_os: ua.os,
    device_type: ua.device,
    device_ua: navigator.userAgent,
    device_screen: `${window.screen.width}x${window.screen.height}`,
    device_viewport: `${window.innerWidth}x${window.innerHeight}`,
    device_theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "ダークモード" : "ライトモード",
    device_language: navigator.language,
    device_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "不明",
    device_network: networkType,
    device_country: loc.country,
    device_region: loc.region,
    device_city: loc.city,
    device_ip: loc.ip,
    device_storage: storageUsage,
    device_memory: memoryUsage,
    page_url: location.href,
    page_referrer: document.referrer || "直接アクセス / ブックマーク",
    sent_at: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
  };
}
