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
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-5">アカウント設定</h1>

      {deletionPending && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="font-bold text-sm mb-1">アカウント削除が予約されています</p>
          <p className="text-sm mb-2">削除予定日: <strong>{scheduledDate}</strong></p>
          <button
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            onClick={cancelDeletion}
          >
            削除をキャンセルする
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 mb-5">
        {user.photoURL ? (
          <Image src={user.photoURL} alt="avatar" width={56} height={56} className="rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">👤</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">アカウント名</span>
            <span className="font-semibold truncate ml-2">{user.displayName || "名前未設定"}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">メールアドレス</span>
            <span className="font-semibold truncate ml-2">{user.email || "（未設定）"}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">最終ログイン: {lastSignIn}</p>
        </div>
      </div>

      <nav className="space-y-2 mb-5">
        <Link href="/account/settings/profile" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">プロフィール</p>
            <p className="text-xs text-gray-500">表示名・メール確認・アカウント削除</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
        <Link href="/account/settings/privacy" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">通知・プライバシー</p>
            <p className="text-xs text-gray-500">メール通知・ニュースレター設定</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
        <Link href="/account/security" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">セキュリティ</p>
            <p className="text-xs text-gray-500">パスワード・二段階認証・デバイス管理</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      </nav>

      <Link href="/account/logout" className="block w-full text-center border border-gray-300 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50">
        ログアウト
      </Link>
      <div className="text-center mt-4">
        <Link href="/" className="text-sm text-gray-400">ホームへ戻る</Link>
      </div>
    </div>
  );
}
