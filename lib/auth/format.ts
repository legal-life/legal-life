import type { Timestamp } from "firebase/firestore";

type TimestampLike = Timestamp | Date | number | null | undefined;

function toDate(ts: TimestampLike): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "number") return new Date(ts);
  if (typeof (ts as Timestamp).toDate === "function") return (ts as Timestamp).toDate();
  return null;
}

export function fmtDate(ts: TimestampLike): string {
  const d = toDate(ts);
  if (!d) return "不明";
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export function relDate(ts: TimestampLike): string {
  const d = toDate(ts);
  if (!d) return "不明";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  if (hr < 24) return `${hr}時間前`;
  if (day < 7) return `${day}日前`;
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export const ACT_LABEL: Record<string, string> = {
  login: "ログイン",
  logout: "ログアウト",
  signup: "アカウント作成",
  password_change: "パスワード変更",
  profile_update: "プロフィール更新",
  twofa_change: "二段階認証変更",
  email_change: "メールアドレス変更",
  method_change: "ログイン方法変更",
  deletion_request: "アカウント削除申請",
};
