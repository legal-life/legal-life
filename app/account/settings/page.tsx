"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getProfile, setDeletionPending, type Profile } from "@/lib/auth/profile";
import { IconPerson, IconBell, IconShield, IconFolder } from "@/components/icons";

export default function SettingsPage() {
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
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <h1 className="text-xl font-bold mb-5">アカウント設定</h1>

      {profile?.deletion_pending && (
        <div className="border-[1.5px] border-red-400 bg-[#fff9f9] rounded-[10px] p-5 mb-6">
          <p className="text-[#c0392b] font-bold text-sm mb-2">アカウント削除が予約されています</p>
          <p className="text-sm mb-3">
            削除予定日:{" "}
            <strong>
              {profile.scheduled_deletion ? new Date(profile.scheduled_deletion).toLocaleString("ja-JP") : "--"}
            </strong>
          </p>
          <button
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold hover:bg-gray-50"
            onClick={cancelDeletion}
          >
            削除をキャンセルする
          </button>
        </div>
      )}

      <div className="flex items-start gap-4 bg-[#f8f9fa] rounded-lg p-4 mb-6">
        {profile?.photo_url ? (
          <Image src={profile.photo_url} alt="avatar" width={64} height={64} className="rounded-full object-cover border-2 border-primary shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0">
            <IconPerson className="w-8 h-8 text-[#9aa0a6]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <span className="block text-[11px] font-bold text-[#5f6368] uppercase tracking-wide">アカウント名</span>
            <span className="block text-sm font-bold truncate">{profile?.display_name || "名前未設定"}</span>
          </div>
          <div>
            <span className="block text-[11px] font-bold text-[#5f6368] uppercase tracking-wide">メールアドレス</span>
            <span className="block text-sm font-bold truncate">{user.email || "（未設定）"}</span>
          </div>
          <p className="text-xs text-[#5f6368] mt-2">最終ログイン: {lastSignIn}</p>
        </div>
      </div>

      <nav className="flex flex-col mb-6 border-t border-[#f1f3f4]">
        {[
          { href: "/account/settings/profile", icon: IconPerson, label: "プロフィール", sub: "表示名・メール確認・アカウント削除" },
          { href: "/account/settings/privacy", icon: IconBell, label: "通知・プライバシー", sub: "メール通知・ニュースレター設定" },
          { href: "/account/security", icon: IconShield, label: "セキュリティ", sub: "パスワード・二段階認証・デバイス管理" },
          ...(profile?.role === "admin"
            ? [{ href: "/admin/inquiries", icon: IconFolder, label: "お問い合わせ管理", sub: "管理者専用ページ" }]
            : []),
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-3.5 py-4 border-b border-[#f1f3f4] hover:bg-[#f8f9fa] -mx-2 px-2 rounded-lg transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#f0fbfc] flex items-center justify-center shrink-0">
              <m.icon className="w-[18px] h-[18px] text-primary-dark" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{m.label}</p>
              <p className="text-xs text-[#5f6368] mt-0.5">{m.sub}</p>
            </div>
            <span className="text-gray-300 shrink-0">›</span>
          </Link>
        ))}
      </nav>

      <Link
        href="/account/logout"
        className="block w-full text-center border-[1.5px] border-[#dadce0] rounded-lg py-2.5 text-sm font-bold hover:bg-gray-50"
      >
        ログアウト
      </Link>
      <div className="text-center mt-4">
        <Link href="/" className="text-sm text-gray-400">ホームへ戻る</Link>
      </div>
    </div>
  );
}
