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

export async function saveNotificationPref(uid: string, key: NotifKey, enabled: boolean) {
  const payload = { user_id: uid, [key]: enabled } as Database["public"]["Tables"]["notification_settings"]["Insert"];
  await supabase.from("notification_settings").upsert(payload);
}

// notification_settingsのトグル(デフォルトtrue)を尊重した上で、Gmail SMTP経由(/api/mail)で
// 会員向け通知メールを送る。宛先を明示的に渡す版(email_changeのようにuser.emailが
// まだ確定していないケース用)と、ログイン中のUserからそのまま送る版の2つを用意する。
export async function sendNotice(uid: string, key: NotifKey, purpose: string, target: { email: string; name?: string }) {
  const prefs = await loadNotificationPrefs(uid);
  if (prefs[key] === false) return;
  await fetch("/api/mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "notice", to_email: target.email, to_name: target.name, purpose }),
  }).catch(() => {
    /* 通知メールの送信失敗でユーザー操作をブロックしない */
  });
}

export async function sendNoticeForUser(user: User, key: NotifKey, purpose: string) {
  if (!user.email || !user.email_confirmed_at) return; // メール未確認のユーザーには送らない
  await sendNotice(user.id, key, purpose, { email: user.email, name: user.user_metadata?.full_name });
}
