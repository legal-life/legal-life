"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { listTotpFactors, getAAL, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import OtpPanel from "@/components/OtpPanel";
import MdAccountCard from "@/components/material/MdAccountCard";

// /account/security/** 配下の各ページで共通して使う「二段階認証(AAL2)ゲート」。
//
// 二段階認証を有効化しているユーザーは、パスワード変更・二段階認証の解除・
// ログイン方法(パスキー/Google連携)の変更といった重要な操作を行う前に、
// 必ずAAL2への昇格(認証アプリのコード再入力)を求められる必要がある。
// 以前はこのチェックが /account/security(一覧ページ)にしか実装されておらず、
// /account/security/pass・/totp・/methods へ直接URLアクセスすると
// AAL1のセッションのままパスワード変更・2FA解除・ログイン方法の変更が
// できてしまう抜け穴があったため、各ページ共通のフックとして切り出した。
export function useSecurityGate() {
  const [user, setUser] = useState<User | null>(null);
  const [needsGate, setNeedsGate] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      const factors = await listTotpFactors();
      if (factors.length > 0) {
        const { currentLevel } = await getAAL();
        if (currentLevel !== "aal2") {
          setNeedsGate(true);
          return;
        }
      }
      setUser(u);
    })();
  }, []);

  return { user, needsGate };
}

export function SecurityGateScreen({ title }: { title: string }) {
  const handleOtpVerify = async (input: string) => {
    const res = await challengeAndVerifyFirstFactor(input);
    if (!res.ok) return res;
    window.location.reload();
    return { ok: true };
  };

  return (
    <MdAccountCard title={title} subtitle="アクセスするには本人確認が必要です">
      <div className="rounded-m3-md bg-md-primary-container p-4 mb-2">
        <p className="font-bold text-m3-body-medium text-md-on-primary-container mb-1">二段階認証が有効です</p>
        <p className="text-m3-body-small text-md-on-primary-container">この操作を行うには認証アプリのコードが必要です。</p>
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
