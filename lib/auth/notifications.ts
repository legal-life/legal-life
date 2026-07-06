export const NOTIFS = [
  { key: "login", label: "ログイン通知", desc: "ログイン時にメールを受け取る" },
  { key: "passwordChange", label: "パスワード変更通知", desc: "パスワード変更時にメールを受け取る" },
  { key: "emailChange", label: "メールアドレス変更通知", desc: "メール変更時に通知を受け取る" },
  { key: "otpChange", label: "二段階認証変更通知", desc: "2FA設定変更時に通知を受け取る" },
  { key: "deletionRequest", label: "アカウント削除通知", desc: "削除申請時にメールを受け取る" },
  { key: "maintenance", label: "メンテナンス通知", desc: "メンテナンス・障害情報を受け取る" },
  { key: "newFeature", label: "新機能通知", desc: "新機能リリース情報を受け取る" },
  { key: "newsletter", label: "ニュースレター", desc: "法令関連ニュースを受け取る" },
] as const;

export type NotifKey = (typeof NOTIFS)[number]["key"];

// Firestoreのキー(newFeature)とResend Audience側のキー(feature)の対応
const AUDIENCE_KEY_MAP: Partial<Record<NotifKey, string>> = {
  maintenance: "maintenance",
  newFeature: "feature",
  newsletter: "newsletter",
};

export async function syncAudience(params: {
  key: NotifKey;
  enabled: boolean;
  email: string;
  name?: string;
}) {
  const audienceKey = AUDIENCE_KEY_MAP[params.key];
  if (!audienceKey) return; // Resend Audience未連携の通知種別(login等)はFirestore設定のみ
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
