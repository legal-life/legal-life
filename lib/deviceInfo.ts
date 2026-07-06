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

export async function collectDeviceInfo() {
  const ua = parseUA();
  return {
    device_browser: ua.browser,
    device_os: ua.os,
    device_type: ua.device,
    device_screen: `${window.screen.width}x${window.screen.height}`,
    page_url: location.href,
    page_referrer: document.referrer || "直接アクセス / ブックマーク",
    sent_at: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
  };
}
