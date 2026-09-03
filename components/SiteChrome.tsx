"use client";

import { usePathname } from "next/navigation";

// /account/** 配下(ログイン・サインアップ・アカウント設定関連の全画面)では
// ヘッダー・フッター・Cookie同意バナーを表示しない。
const HIDDEN_CHROME_PREFIX = "/account";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === HIDDEN_CHROME_PREFIX || pathname.startsWith(`${HIDDEN_CHROME_PREFIX}/`)) return null;
  return <>{children}</>;
}
