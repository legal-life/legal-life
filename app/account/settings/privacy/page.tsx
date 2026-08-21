"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { NOTIFS, loadNotificationPrefs, saveNotificationPref, syncAudience, type NotifKey } from "@/lib/auth/notifications";

export default function PrivacyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState<Partial<Record<NotifKey, boolean>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      try {
        setPrefs(await loadNotificationPrefs(u.id));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (key: NotifKey, checked: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: checked }));
    try {
      await saveNotificationPref(user.id, key, checked);
    } catch {
      /* ignore */
    }
    if (user.email) {
      await syncAudience({ key, enabled: checked, email: user.email, name: user.user_metadata?.full_name });
    }
  };

  if (!user) return null;

  const emailVerified = !!user.email_confirmed_at;

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">通知・プライバシー設定</h1>
      <p className="text-sm text-gray-500 mb-5">メールアドレス確認済みの場合のみ通知が届きます</p>

      <p className="text-xs font-bold text-gray-500 mb-2">メール通知設定</p>
      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <div className="divide-y border border-[#dadce0] rounded-xl bg-white">
          {NOTIFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  disabled={!emailVerified}
                  checked={prefs[key] !== false}
                  onChange={(e) => toggle(key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary peer-disabled:opacity-50 transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      )}
      {!emailVerified && (
        <p className="text-xs text-[#e74c3c] mt-3">⚠️ メールアドレス未確認のため通知は届きません。</p>
      )}

      <div className="text-center mt-6">
        <Link href="/account/settings" className="text-sm text-primary-dark font-semibold">アカウント設定に戻る</Link>
      </div>
    </div>
  );
}
