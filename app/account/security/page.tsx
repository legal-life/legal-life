"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { listTotpFactors, getAAL, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import OtpPanel from "@/components/OtpPanel";
import MdAccountCard from "@/components/material/MdAccountCard";

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [enabled2fa, setEnabled2fa] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [needsGate, setNeedsGate] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      const factors = await listTotpFactors();
      const en = factors.length > 0;
      setEnabled2fa(en);
      setHasPassword((u.identities ?? []).some((i) => i.provider === "email"));

      if (en) {
        const { currentLevel } = await getAAL();
        if (currentLevel !== "aal2") {
          setNeedsGate(true);
          return;
        }
      }
      setUser(u);
    })();
  }, []);

  const handleOtpVerify = async (input: string) => {
    const res = await challengeAndVerifyFirstFactor(input);
    if (!res.ok) return res;
    window.location.reload();
    return { ok: true };
  };

  if (needsGate) {
    return (
      <MdAccountCard title="セキュリティ" subtitle="アクセスするには本人確認が必要です">
        <div className="rounded-m3-md bg-md-primary-container p-4 mb-2">
          <p className="font-bold text-m3-body-medium text-md-on-primary-container mb-1">二段階認証が有効です</p>
          <p className="text-m3-body-small text-md-on-primary-container">セキュリティ設定を表示するには認証アプリのコードが必要です。</p>
        </div>
        <OtpPanel
          title="本人確認"
          desc="認証アプリに表示されている6桁のコードを入力してください"
          onVerify={handleOtpVerify}
          onCancel={() => window.location.replace("/account")}
        />
        <div className="mt-4">
          <Link href="/account" className="text-m3-body-medium text-md-on-surface-variant">アカウント設定に戻る</Link>
        </div>
      </MdAccountCard>
    );
  }

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
