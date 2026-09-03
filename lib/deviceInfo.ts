import { fetchLocation, parseUA } from "@/lib/browserInfo";

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
