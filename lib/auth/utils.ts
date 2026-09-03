export function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function encR(url: string): string {
  try {
    return btoa(unescape(encodeURIComponent(url)));
  } catch {
    return "";
  }
}

export function decR(enc: string): string | null {
  try {
    const d = decodeURIComponent(escape(atob(enc)));
    return d.startsWith("/") ? d : null;
  } catch {
    return null;
  }
}

export function parseUA() {
  const ua = navigator.userAgent;
  let browser = "その他";
  let os = "その他";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  return {
    browser,
    os,
    device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "スマートフォン/タブレット" : "PC",
  };
}

export async function fetchLocation(): Promise<string> {
  try {
    const r = await fetch("https://cloudflare.com/cdn-cgi/trace", {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) {
      const text = await r.text();
      const loc = text.match(/loc=([A-Z]{2})/)?.[1];
      if (loc) return loc;
    }
  } catch {
    /* ignore */
  }
  return "不明";
}

const SESSION_KEY = "legallife_session_id";

export function getSid(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export { SESSION_KEY };

// SupabaseダッシュボードのAuthentication > Policies (Password)で設定した
// パスワード要件(最小8文字、大文字・小文字・数字・記号を各1文字以上)と一致させる。
// サーバー側の実際の判定はSupabaseが行うため、ここでの判定はあくまで
// クライアント側の事前チェック(分かりやすいエラーメッセージの提示)用途。
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "8文字以上にしてください";
  if (!/[a-z]/.test(pw)) return "小文字を1文字以上含めてください";
  if (!/[A-Z]/.test(pw)) return "大文字を1文字以上含めてください";
  if (!/[0-9]/.test(pw)) return "数字を1文字以上含めてください";
  if (!/[^a-zA-Z0-9]/.test(pw)) return "記号を1文字以上含めてください";
  return null;
}

// Google One Tap用のnonceペアを生成する。生のnonceはSupabaseのsignInWithIdTokenへ、
// SHA-256でハッシュ化した方はGoogle Identity Servicesのinitializeへそれぞれ渡す必要がある
// (id_token内のnonceクレームとSupabase側へ渡すnonceが一致しないと
// "Passed nonce and nonce in id_token should either both exist or not." エラーになる)。
export async function generateNonce(): Promise<[string, string]> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoded = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [nonce, hashedNonce];
}
