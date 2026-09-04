import { supabase } from "@/lib/supabase/client";

// Supabase Auth標準の多要素認証(TOTP)を薄くラップするヘルパー。
// 独自メールOTP実装(旧lib/auth/otp.ts)を置き換え、Supabaseの
// enroll/challenge/verify APIに一本化する。

// listFactors()はTOTP登録を最後まで完了していない("unverified"のまま放置された)
// ファクターも含めて返す。verify()未完了のファクターはchallenge()に使えず、
// ログインのAAL判定にも影響しないため、ここでは検証済み("verified")のものだけを返す。
// これを怠ると、hasMFA()が「2FA有効」と誤判定したり、challengeAndVerifyFirstFactor()が
// 未検証ファクターを選んでしまい常に失敗する(=SecurityGateの各ページで
// パスワード変更・2FA解除等が一切できなくなる)不具合につながる。
export async function listTotpFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.filter((f) => f.status === "verified");
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
