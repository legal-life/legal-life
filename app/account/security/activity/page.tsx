"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { ACT_LABEL, fmtDate, relDate } from "@/lib/auth/format";

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
    <div className="w-full max-w-[640px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">最近のアクティビティ</h1>
      <p className="text-sm text-gray-500 mb-5">過去1年間のアカウント操作ログ(最大50件)</p>

      {error && <p className="text-sm text-[#e74c3c]">読み込みに失敗しました: {error}</p>}
      {!error && items === null && <p className="text-sm text-gray-400">読み込み中...</p>}
      {!error && items?.length === 0 && <p className="text-sm text-gray-400">アクティビティ履歴はありません</p>}

      {!!items?.length && (
        <div>
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-3.5 py-3.5 border-b border-[#f1f3f4] last:border-b-0">
              <span className="w-9 h-9 rounded-full bg-[#f8f9fa] flex items-center justify-center shrink-0 text-base">📋</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <p className="text-sm font-semibold">
                    {ACT_LABEL[it.type] || it.type}
                    {it.detail && <span className="text-gray-500 font-normal"> — {it.detail}</span>}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{relDate(it.created_at)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[it.browser, it.os].filter(Boolean).join(" / ")} · {fmtDate(it.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#fffdf0] border border-[#ffc107]/70 rounded-xl p-4 mt-6">
        <p className="font-bold text-sm mb-1">身に覚えのない操作がある場合</p>
        <p className="text-xs text-[#856404] mb-3 leading-relaxed">
          不審なアクセスを発見した場合は、すぐにパスワードを変更し、二段階認証を有効にしてください。
        </p>
        <div className="flex gap-2">
          <Link href="/account/security/pass" className="flex-1 text-center bg-primary text-white text-sm font-bold rounded-lg py-2">
            パスワードを変更
          </Link>
          <Link href="/account/security/2fa" className="flex-1 text-center border border-[#dadce0] text-sm font-semibold rounded-lg py-2">
            二段階認証を確認
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
