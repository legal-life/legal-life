import { supabase } from "@/lib/supabase/client";

// Supabase Auth標準の多要素認証(TOTP)を薄くラップするヘルパー。
// 独自メールOTP実装(旧lib/auth/otp.ts)を置き換え、Supabaseの
// enroll/challenge/verify APIに一本化する。

export async function listTotpFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp;
}

export async function hasMFA(): Promise<boolean> {
  try {
    return (await listTotpFactors()).length > 0;
  } catch {
    return false;
  }
}

export async function getAAL() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
}

// ログイン直後などに、追加のMFA認証(AAL1→AAL2)が必要かどうかを判定する。
export async function needsMfaChallenge(): Promise<boolean> {
  const { currentLevel, nextLevel } = await getAAL();
  return nextLevel === "aal2" && nextLevel !== currentLevel;
}

export type MfaResult = { ok: boolean; reason?: string };

// 現在ログイン中のユーザーの(検証済み)TOTPファクターに対してチャレンジ+検証を行う。
// パスワード変更・アカウント削除等、重要操作の前の再確認に使う。
export async function challengeAndVerifyFirstFactor(code: string): Promise<MfaResult> {
  const factors = await listTotpFactors().catch(() => []);
  const factor = factors[0];
  if (!factor) return { ok: false, reason: "認証アプリが登録されていません" };
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError) return { ok: false, reason: challengeError.message };
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) return { ok: false, reason: verifyError.message };
  return { ok: true };
}
