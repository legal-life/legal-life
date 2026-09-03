"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/auth/requireAuth";
import { NOTIFS, loadNotificationPrefs, saveNotificationPref, type NotifKey } from "@/lib/auth/notifications";
import { IconWarning } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdSwitch from "@/components/material/MdSwitch";
import Link from "next/link";

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
  };

  if (!user) return null;

  const emailVerified = !!user.email_confirmed_at;

  return (
    <MdAccountCard backHref="/account/settings" backLabel="アカウント設定に戻る" title="通知・プライバシー設定" subtitle="メールアドレス確認済みの場合のみ通知が届きます">
      <p className="text-m3-label-small text-md-on-surface-variant mb-2 uppercase tracking-wide">メール通知設定</p>
      {loading ? (
        <p className="text-m3-body-medium text-md-on-surface-variant">読み込み中...</p>
      ) : (
        <div className="divide-y divide-md-outline-variant rounded-m3-md bg-md-surface-container-lowest border border-md-outline-variant">
          {NOTIFS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-m3-body-medium font-semibold text-md-on-surface">{label}</p>
                <p className="text-m3-body-small text-md-on-surface-variant">{desc}</p>
              </div>
              <MdSwitch disabled={!emailVerified} checked={prefs[key] !== false} onChange={(e) => toggle(key, e.target.checked)} />
            </div>
          ))}
        </div>
      )}
      {!emailVerified && (
        <p className="text-m3-body-small text-md-error mt-3 flex items-center gap-1">
          <IconWarning className="w-3.5 h-3.5 shrink-0" /> メールアドレス未確認のため通知は届きません。
        </p>
      )}

      <div className="text-center mt-6">
        <Link href="/account/settings" className="text-m3-body-medium text-md-primary font-medium">アカウント設定に戻る</Link>
      </div>
    </MdAccountCard>
  );
}
