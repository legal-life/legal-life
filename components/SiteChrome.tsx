"use client";

import { usePathname } from "next/navigation";

// ログイン・サインアップ画面ではヘッダー・フッター・Cookie同意バナーを表示しない。
const HIDDEN_CHROME_PATHS = ["/account/login", "/account/signup"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (HIDDEN_CHROME_PATHS.includes(pathname)) return null;
  return <>{children}</>;
}
