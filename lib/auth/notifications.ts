import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export const NOTIFS = [
  { key: "login", label: "ログイン通知", desc: "ログイン時にメールを受け取る" },
  { key: "password_change", label: "パスワード変更通知", desc: "パスワード変更時にメールを受け取る" },
  { key: "email_change", label: "メールアドレス変更通知", desc: "メール変更時に通知を受け取る" },
  { key: "otp_change", label: "二段階認証変更通知", desc: "2FA設定変更時に通知を受け取る" },
  { key: "deletion_request", label: "アカウント削除通知", desc: "削除申請時にメールを受け取る" },
  { key: "maintenance", label: "メンテナンス通知", desc: "メンテナンス・障害情報を受け取る" },
  { key: "new_feature", label: "新機能通知", desc: "新機能リリース情報を受け取る" },
  { key: "newsletter", label: "ニュースレター", desc: "法令関連ニュースを受け取る" },
] as const;

export type NotifKey = (typeof NOTIFS)[number]["key"];

export async function loadNotificationPrefs(uid: string): Promise<Partial<Record<NotifKey, boolean>>> {
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();
  return data ?? {};
}

// lib/auth/profile.ts の updateDisplayName/setDeletionPending と同じ理由でエラーをthrowする。
// 呼び出し元(通知設定ページ)はUIを楽観的更新した後この関数を待つため、ここでエラーを
// 握りつぶすと保存に失敗していてもトグルが「オン」のまま表示され続けてしまう。
export async function saveNotificationPref(uid: string, key: NotifKey, enabled: boolean) {
  const payload = { user_id: uid, [key]: enabled } as Database["public"]["Tables"]["notification_settings"]["Insert"];
  const { error } = await supabase.from("notification_settings").upsert(payload);
  if (error) throw error;
}

// notification_settingsのトグル(デフォルトtrue)を尊重した上で、Gmail SMTP経由(/api/mail)で
// 会員向け通知メールを送る。宛先を明示的に渡す版(email_changeのようにuser.emailが
// まだ確定していないケース用)と、ログイン中のUserからそのまま送る版の2つを用意する。
// /api/mailのnotice種別は認証済みセッションを要求するため、現在のアクセストークンを
// Authorizationヘッダーで渡す(未ログイン状態からの任意宛先へのメール送信を防ぐため)。
export async function sendNotice(uid: string, key: NotifKey, purpose: string, target: { email: string; name?: string }) {
  const prefs = await loadNotificationPrefs(uid);
  if (prefs[key] === false) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;
  await fetch("/api/mail", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ type: "notice", to_email: target.email, to_name: target.name, purpose }),
  }).catch(() => {
    /* 通知メールの送信失敗でユーザー操作をブロックしない */
  });
}

export async function sendNoticeForUser(user: User, key: NotifKey, purpose: string) {
  if (!user.email || !user.email_confirmed_at) return; // メール未確認のユーザーには送らない
  await sendNotice(user.id, key, purpose, { email: user.email, name: user.user_metadata?.full_name });
}
