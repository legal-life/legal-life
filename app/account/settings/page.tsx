"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [deletionPending, setDeletionPending] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, "users", u.uid)).catch(() => null);
      if (snap?.exists() && snap.data().deletionPending) {
        setDeletionPending(true);
        const d = snap.data().scheduledDeletion?.toDate?.();
        if (d) setScheduledDate(d.toLocaleString("ja-JP"));
      }
    })();
  }, []);

  const cancelDeletion = async () => {
    if (!user || !confirm("キャンセルしますか?")) return;
    const db = getFirebaseDb();
    await setDoc(doc(db, "users", user.uid), { deletionPending: false, scheduledDeletion: null }, { merge: true });
    setDeletionPending(false);
  };

  if (!user) return null;

  const lastSignIn = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "--";

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <h1 className="text-xl font-bold mb-5">アカウント設定</h1>

      {deletionPending && (
        <div className="border-[1.5px] border-red-400 bg-[#fff9f9] rounded-[10px] p-5 mb-6">
          <p className="text-[#c0392b] font-bold text-sm mb-2">アカウント削除が予約されています</p>
          <p className="text-sm mb-3">削除予定日: <strong>{scheduledDate}</strong></p>
          <button
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold hover:bg-gray-50"
            onClick={cancelDeletion}
          >
            削除をキャンセルする
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        {user.photoURL ? (
          <Image src={user.photoURL} alt="avatar" width={56} height={56} className="rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">👤</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{user.displayName || "名前未設定"}</p>
          <p className="text-sm text-[#5f6368] truncate">{user.email || "（未設定）"}</p>
          <p className="text-xs text-gray-400 mt-1">最終ログイン: {lastSignIn}</p>
        </div>
      </div>

      <nav className="flex flex-col mb-6 border-t border-[#f1f3f4]">
        {[
          { href: "/account/settings/profile", icon: "👤", label: "プロフィール", sub: "表示名・メール確認・アカウント削除" },
          { href: "/account/settings/privacy", icon: "🔔", label: "通知・プライバシー", sub: "メール通知・ニュースレター設定" },
          { href: "/account/security", icon: "🛡️", label: "セキュリティ", sub: "パスワード・二段階認証・デバイス管理" },
        ].map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="flex items-center gap-3.5 py-4 border-b border-[#f1f3f4] hover:bg-[#f8f9fa] -mx-2 px-2 rounded-lg transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#f0fbfc] flex items-center justify-center shrink-0">{m.icon}</span>
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
