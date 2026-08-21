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

// notification_settingsテーブルのキー(new_feature)とResend Audience側のキー(feature)の対応
const AUDIENCE_KEY_MAP: Partial<Record<NotifKey, string>> = {
  maintenance: "maintenance",
  new_feature: "feature",
  newsletter: "newsletter",
};

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

export async function syncAudience(params: {
  key: NotifKey;
  enabled: boolean;
  email: string;
  name?: string;
}) {
  const audienceKey = AUDIENCE_KEY_MAP[params.key];
  if (!audienceKey) return; // Resend Audience未連携の通知種別(login等)はDB設定のみ
  await fetch("/api/mail/audience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: params.enabled ? "add" : "remove",
      email: params.email,
      name: params.name,
      audiences: [audienceKey],
    }),
  }).catch(() => {
    /* Audience同期の失敗はUI上の設定変更をブロックしない */
  });
}
