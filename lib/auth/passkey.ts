import { supabase } from "@/lib/supabase/client";

// Supabase Auth標準のパスキー(WebAuthn)機能を薄くラップするヘルパー。
// signInWithPasskey/registerPasskeyは navigator.credentials.* を使った
// ブラウザ側のセレモニー全体を1回の呼び出しで完結させる。

export type PasskeyItem = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export async function listPasskeys(): Promise<PasskeyItem[]> {
  const { data, error } = await supabase.auth.passkey.list();
  if (error) throw error;
  return data;
}

// 現在ログイン中のユーザーに新しいパスキーを登録する(要アクティブセッション)。
export async function registerPasskey() {
  const { data, error } = await supabase.auth.registerPasskey();
  if (error) throw error;
  return data;
}

export async function renamePasskey(passkeyId: string, friendlyName: string) {
  const { error } = await supabase.auth.passkey.update({ passkeyId, friendlyName });
  if (error) throw error;
}

export async function deletePasskey(passkeyId: string) {
  const { error } = await supabase.auth.passkey.delete({ passkeyId });
  if (error) throw error;
}

// パスキーでログインする(未ログイン状態から呼ぶ)。
export async function signInWithPasskey() {
  return supabase.auth.signInWithPasskey();
}
