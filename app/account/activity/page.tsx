"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { ACT_LABEL, fmtDate, relDate } from "@/lib/auth/format";
import { IconClipboard } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";

type Activity = {
  type: string;
  detail: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
};

export default function ActivityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const { data, error } = await supabase
        .from("activity_log")
        .select("type, detail, browser, os, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) setError(error.message);
      else setItems(data);
    })();
  }, []);

  if (!user) return null;

  return (
    <MdAccountCard
      backHref="/account"
      backLabel="アカウント設定に戻る"
      title="最近のアクティビティ"
      subtitle="過去1年間のアカウント操作ログ(最大50件)"
      maxWidthClassName="max-w-[640px]"
    >
      {error && <p className="text-m3-body-medium text-md-error">読み込みに失敗しました: {error}</p>}
      {!error && items === null && <p className="text-m3-body-medium text-md-on-surface-variant">読み込み中...</p>}
      {!error && items?.length === 0 && <p className="text-m3-body-medium text-md-on-surface-variant">アクティビティ履歴はありません</p>}

      {!!items?.length && (
        <div>
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-3.5 py-3.5 border-b border-md-outline-variant last:border-b-0">
              <span className="w-9 h-9 rounded-full bg-md-surface-container flex items-center justify-center shrink-0">
                <IconClipboard className="w-4 h-4 text-md-on-surface-variant" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-m3-body-medium font-semibold text-md-on-surface">
                    {ACT_LABEL[it.type] || it.type}
                    {it.detail && <span className="text-md-on-surface-variant font-normal"> — {it.detail}</span>}
                  </p>
                  <span className="text-m3-body-small text-md-on-surface-variant shrink-0 whitespace-nowrap">{relDate(it.created_at)}</span>
                </div>
                <p className="text-m3-body-small text-md-on-surface-variant mt-0.5">
                  {[it.browser, it.os].filter(Boolean).join(" / ")} · {fmtDate(it.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-m3-md bg-[#fff8e1] border border-[#f9a825]/40 p-4 mt-6">
        <p className="font-bold text-m3-body-medium text-md-on-surface mb-1">身に覚えのない操作がある場合</p>
        <p className="text-m3-body-small text-[#856404] mb-3 leading-relaxed">
          不審なアクセスを発見した場合は、すぐにパスワードを変更し、二段階認証を有効にしてください。
        </p>
        <div className="flex gap-2">
          <Link
            href="/account/security/pass"
            className="flex-1 flex items-center justify-center h-10 rounded-full bg-md-primary text-md-on-primary text-m3-label-large font-medium"
          >
            パスワードを変更
          </Link>
          <Link
            href="/account/security/totp"
            className="flex-1 flex items-center justify-center h-10 rounded-full border border-md-outline text-md-primary text-m3-label-large font-medium"
          >
            二段階認証を確認
          </Link>
        </div>
      </div>

      <div className="text-center mt-5">
        <Link href="/account" className="text-m3-body-medium text-md-on-surface-variant">アカウント設定に戻る</Link>
      </div>
    </MdAccountCard>
  );
}
