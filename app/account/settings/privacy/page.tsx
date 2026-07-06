"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { NOTIFS, syncAudience, type NotifKey } from "@/lib/auth/notifications";

export default function PrivacyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      try {
        const s = await getDoc(doc(db, "users", u.uid, "settings", "notifications"));
        if (s.exists()) setPrefs(s.data() as Record<string, boolean>);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (key: NotifKey, checked: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: checked }));
    const db = getFirebaseDb();
    try {
      await setDoc(doc(db, "users", user.uid, "settings", "notifications"), { [key]: checked }, { merge: true });
    } catch {
      /* ignore */
    }
    if (user.email) {
      await syncAudience({ key, enabled: checked, email: user.email, name: user.displayName || undefined });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">通知・プライバシー設定</h1>
      <p className="text-sm text-gray-500 mb-5">メールアドレス確認済みの場合のみ通知が届きます</p>

      <p className="text-xs font-bold text-gray-500 mb-2">メール通知設定</p>
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="divide-y border rounded-xl bg-white">
          {NOTIFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <input
                type="checkbox"
                disabled={!user.emailVerified}
                checked={prefs[key] !== false}
                onChange={(e) => toggle(key, e.target.checked)}
              />
            </div>
          ))}
        </div>
      )}
      {!user.emailVerified && (
        <p className="text-xs text-red-500 mt-3">⚠️ メールアドレス未確認のため通知は届きません。</p>
      )}

      <div className="text-center mt-6">
        <Link href="/account/settings" className="text-sm text-primary-dark font-semibold">アカウント設定に戻る</Link>
      </div>
    </div>
  );
}
