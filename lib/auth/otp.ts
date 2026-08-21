import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export const OTP_EXPIRE_MIN = 5;

export function genOTP(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export async function saveOTP(uid: string, code: string, purpose: string) {
  await supabase.from("security_2fa").upsert({
    user_id: uid,
    otp_code: code,
    otp_expiry: new Date(Date.now() + OTP_EXPIRE_MIN * 60000).toISOString(),
    otp_purpose: purpose,
  });
}

export async function verifyOTP(uid: string, input: string, purpose: string) {
  const { data } = await supabase
    .from("security_2fa")
    .select("otp_code, otp_expiry, otp_purpose")
    .eq("user_id", uid)
    .maybeSingle();
  if (!data) return { ok: false, reason: "コードが見つかりません" };
  const { otp_code, otp_expiry, otp_purpose } = data;
  if (otp_purpose !== purpose) return { ok: false, reason: "用途が一致しません" };
  if (!otp_expiry || Date.now() > new Date(otp_expiry).getTime()) return { ok: false, reason: "有効期限が切れています" };
  if (otp_code !== input) return { ok: false, reason: "コードが正しくありません" };
  return { ok: true };
}

export async function clearOTP(uid: string) {
  await supabase
    .from("security_2fa")
    .update({ otp_code: null, otp_expiry: null, otp_purpose: null })
    .eq("user_id", uid);
}

export async function is2FA(uid: string): Promise<boolean> {
  try {
    const { data } = await supabase.from("security_2fa").select("enabled").eq("user_id", uid).maybeSingle();
    return data?.enabled ?? false;
  } catch {
    return false;
  }
}

export async function sendOTP(user: Pick<User, "email"> & { displayName?: string | null }, code: string, purpose: string) {
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

export async function tryBackup(uid: string, input: string) {
  if (!input?.trim()) return { ok: false as const };
  try {
    const code = input.toUpperCase().trim();
    const { data } = await supabase
      .from("backup_codes")
      .select("id, used")
      .eq("user_id", uid)
      .eq("code", code)
      .maybeSingle();
    if (!data) {
      const { count } = await supabase
        .from("backup_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid);
      return {
        ok: false as const,
        reason: !count ? "バックアップコードが設定されていません" : "バックアップコードが正しくありません",
      };
    }
    if (data.used) return { ok: false as const, reason: "バックアップコードが正しくありません" };
    await supabase.from("backup_codes").update({ used: true }).eq("id", data.id);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, reason: e instanceof Error ? e.message : String(e) };
  }
}
