"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listTotpFactors } from "@/lib/auth/mfa";
import MdAccountCard from "@/components/material/MdAccountCard";
import { useSecurityGate, SecurityGateScreen } from "./SecurityGate";

export default function SecurityPage() {
  const { user, needsGate } = useSecurityGate();
  const [enabled2fa, setEnabled2fa] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setEnabled2fa((await listTotpFactors()).length > 0);
      setHasPassword((user.identities ?? []).some((i) => i.provider === "email"));
    })();
  }, [user]);

  if (needsGate) return <SecurityGateScreen title="セキュリティ" />;

  if (!user) return null;

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "--";

  return (
    <MdAccountCard backHref="/account" backLabel="アカウント設定に戻る" title="セキュリティ" subtitle={`最終ログイン: ${lastSignIn}`}>
      <p className="text-m3-label-small text-md-on-surface-variant mb-2 uppercase tracking-wide">ログインとパスワード</p>
      <nav className="space-y-2 mb-5">
        <Link href="/account/security/pass" className="flex items-center gap-3 bg-md-surface-container-lowest border border-md-outline-variant rounded-m3-md px-4 py-3 hover:bg-md-surface-container">
          <div className="flex-1">
            <p className="font-semibold text-m3-body-medium text-md-on-surface">パスワード</p>
            <p className="text-m3-body-small text-md-on-surface-variant">{hasPassword ? "設定済み" : "未設定"}</p>
          </div>
          <span className="text-md-outline">›</span>
        </Link>
        <Link href="/account/security/totp" className="flex items-center gap-3 bg-md-surface-container-lowest border border-md-outline-variant rounded-m3-md px-4 py-3 hover:bg-md-surface-container">
          <div className="flex-1">
            <p className="font-semibold text-m3-body-medium text-md-on-surface">二段階認証</p>
            <p className={`text-m3-body-small ${enabled2fa ? "text-[#146c2e]" : "text-md-on-surface-variant"}`}>{enabled2fa ? "有効" : "無効"}</p>
          </div>
          <span className="text-md-outline">›</span>
        </Link>
        <Link href="/account/security/methods" className="flex items-center gap-3 bg-md-surface-container-lowest border border-md-outline-variant rounded-m3-md px-4 py-3 hover:bg-md-surface-container">
          <div className="flex-1">
            <p className="font-semibold text-m3-body-medium text-md-on-surface">ログイン方法</p>
            <p className="text-m3-body-small text-md-on-surface-variant">メール・Google連携の管理</p>
          </div>
          <span className="text-md-outline">›</span>
        </Link>
      </nav>

      <div className="text-center">
        <Link href="/account" className="text-m3-body-medium text-md-primary font-medium">アカウント設定に戻る</Link>
      </div>
    </MdAccountCard>
  );
}
