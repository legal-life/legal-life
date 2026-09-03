"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getProfile, setDeletionPending, type Profile } from "@/lib/auth/profile";
import { IconPerson, IconBell, IconShield, IconLaptop, IconFolder } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      setProfile(await getProfile(u.id));
    })();
  }, []);

  const cancelDeletion = async () => {
    if (!user || !confirm("キャンセルしますか?")) return;
    await setDeletionPending(user.id, false);
    setProfile((p) => (p ? { ...p, deletion_pending: false, scheduled_deletion: null } : p));
  };

  if (!user) return null;

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "--";

  return (
    <MdAccountCard title="アカウント設定">
      {profile?.deletion_pending && (
        <div className="rounded-m3-md bg-md-error-container p-5 mb-6">
          <p className="text-md-on-error-container font-bold text-m3-body-medium mb-2">アカウント削除が予約されています</p>
          <p className="text-m3-body-medium text-md-on-error-container mb-3">
            削除予定日:{" "}
            <strong>
              {profile.scheduled_deletion ? new Date(profile.scheduled_deletion).toLocaleString("ja-JP") : "--"}
            </strong>
          </p>
          <MdButton variant="outlined" onClick={cancelDeletion}>
            削除をキャンセルする
          </MdButton>
        </div>
      )}

      <div className="flex items-start gap-4 rounded-m3-md bg-md-surface-container p-4 mb-6">
        {profile?.photo_url ? (
          <Image src={profile.photo_url} alt="avatar" width={64} height={64} className="rounded-full object-cover border-2 border-md-primary shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-md-surface-container-high flex items-center justify-center shrink-0">
            <IconPerson className="w-8 h-8 text-md-on-surface-variant" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <span className="block text-m3-label-small text-md-on-surface-variant uppercase tracking-wide">アカウント名</span>
            <span className="block text-m3-body-medium font-bold text-md-on-surface truncate">{profile?.display_name || "名前未設定"}</span>
          </div>
          <div>
            <span className="block text-m3-label-small text-md-on-surface-variant uppercase tracking-wide">メールアドレス</span>
            <span className="block text-m3-body-medium font-bold text-md-on-surface truncate">{user.email || "（未設定）"}</span>
          </div>
          <p className="text-m3-body-small text-md-on-surface-variant mt-2">最終ログイン: {lastSignIn}</p>
        </div>
      </div>

      <nav className="flex flex-col mb-6 border-t border-md-outline-variant">
        {[
          { href: "/account/profile", icon: IconPerson, label: "プロフィール", sub: "表示名・メール確認・アカウント削除" },
          { href: "/account/privacy", icon: IconBell, label: "通知・プライバシー", sub: "メール通知・ニュースレター設定" },
          { href: "/account/security", icon: IconShield, label: "セキュリティ", sub: "パスワード・二段階認証・ログイン方法" },
          { href: "/account/device", icon: IconLaptop, label: "デバイス管理", sub: "ログイン中のデバイス・アクティビティ履歴" },
          ...(profile?.role === "admin"
            ? [{ href: "/admin/inquiries", icon: IconFolder, label: "お問い合わせ管理", sub: "管理者専用ページ" }]
            : []),
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-3.5 py-4 border-b border-md-outline-variant hover:bg-md-surface-container -mx-2 px-2 rounded-m3-sm transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-md-primary-container flex items-center justify-center shrink-0">
              <m.icon className="w-[18px] h-[18px] text-md-on-primary-container" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-m3-body-medium text-md-on-surface">{m.label}</p>
              <p className="text-m3-body-small text-md-on-surface-variant mt-0.5">{m.sub}</p>
            </div>
            <span className="text-md-outline shrink-0">›</span>
          </Link>
        ))}
      </nav>

      <Link
        href="/account/logout"
        className="flex items-center justify-center w-full h-10 rounded-full border border-md-outline text-md-primary text-m3-label-large font-medium hover:bg-md-primary/8 transition-colors"
      >
        ログアウト
      </Link>
      <div className="text-center mt-4">
        <Link href="/" className="text-m3-body-small text-md-on-surface-variant">ホームへ戻る</Link>
      </div>
    </MdAccountCard>
  );
}
