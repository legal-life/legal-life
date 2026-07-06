import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";

export const OTP_EXPIRE_MIN = 5;

export function genOTP(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export async function saveOTP(uid: string, db: Firestore, code: string, purpose: string) {
  await setDoc(
    doc(db, "users", uid, "security", "twoFactor"),
    { otpCode: code, otpExpiryMs: Date.now() + OTP_EXPIRE_MIN * 60000, otpPurpose: purpose },
    { merge: true },
  );
}

export async function verifyOTP(uid: string, db: Firestore, input: string, purpose: string) {
  const s = await getDoc(doc(db, "users", uid, "security", "twoFactor"));
  if (!s.exists()) return { ok: false, reason: "コードが見つかりません" };
  const { otpCode, otpExpiryMs, otpPurpose } = s.data() as {
    otpCode?: string;
    otpExpiryMs?: number;
    otpPurpose?: string;
  };
  if (otpPurpose !== purpose) return { ok: false, reason: "用途が一致しません" };
  if (!otpExpiryMs || Date.now() > otpExpiryMs) return { ok: false, reason: "有効期限が切れています" };
  if (otpCode !== input) return { ok: false, reason: "コードが正しくありません" };
  return { ok: true };
}

export async function clearOTP(uid: string, db: Firestore) {
  await setDoc(
    doc(db, "users", uid, "security", "twoFactor"),
    { otpCode: null, otpExpiryMs: null, otpPurpose: null },
    { merge: true },
  );
}

export async function is2FA(uid: string, db: Firestore): Promise<boolean> {
  try {
    const s = await getDoc(doc(db, "users", uid, "security", "twoFactor"));
    return s.exists() && ((s.data().enabled as boolean) ?? false);
  } catch {
    return false;
  }
}

export async function sendOTP(
  user: Pick<User, "email" | "displayName">,
  code: string,
  purpose: string,
) {
  if (!user?.email) throw new Error("メールアドレスが設定されていません");
  const res = await fetch("/api/mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "otp",
      to_email: user.email,
      to_name: user.displayName || "ユーザー",
      otp_code: code,
      expiry_minutes: OTP_EXPIRE_MIN,
      purpose,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "メール送信に失敗しました");
  }
}

export async function tryBackup(uid: string, db: Firestore, input: string) {
  if (!input?.trim()) return { ok: false as const };
  try {
    const s = await getDoc(doc(db, "users", uid, "security", "BackUpCode"));
    if (!s.exists()) return { ok: false as const, reason: "バックアップコードが設定されていません" };
    const codes = (s.data().codes || []) as { code: string; used: boolean }[];
    const idx = codes.findIndex((c) => !c.used && c.code === input.toUpperCase().trim());
    if (idx === -1) return { ok: false as const, reason: "バックアップコードが正しくありません" };
    codes[idx].used = true;
    await setDoc(doc(db, "users", uid, "security", "BackUpCode"), { codes }, { merge: true });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, reason: e instanceof Error ? e.message : String(e) };
  }
}
