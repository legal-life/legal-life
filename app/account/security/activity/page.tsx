"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { ACT_LABEL, fmtDate, relDate } from "@/lib/auth/format";

type Activity = {
  type: string;
  detail?: string;
  browser?: string;
  os?: string;
  timestamp: unknown;
};

export default function ActivityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      try {
        const q = query(collection(db, "users", u.uid, "activity"), orderBy("timestamp", "desc"), limit(50));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => d.data() as Activity));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">最近のアクティビティ</h1>
      <p className="text-sm text-gray-500 mb-5">過去1年間のアカウント操作ログ(最大50件)</p>

      {error && <p className="text-sm text-red-600">読み込みに失敗しました: {error}</p>}
      {!error && items === null && <p className="text-sm text-gray-400">読み込み中...</p>}
      {!error && items?.length === 0 && <p className="text-sm text-gray-400">アクティビティ履歴はありません</p>}

      {!!items?.length && (
        <div className="divide-y border rounded-xl bg-white">
          {items.map((it, i) => (
            <div key={i} className="px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">
                  {ACT_LABEL[it.type] || it.type}
                  {it.detail && <span className="text-gray-500 font-normal"> — {it.detail}</span>}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {[it.browser, it.os].filter(Boolean).join(" / ")} · {fmtDate(it.timestamp as never)}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-2">{relDate(it.timestamp as never)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
        <p className="font-bold text-sm mb-1">身に覚えのない操作がある場合</p>
        <p className="text-xs text-amber-700 mb-3 leading-relaxed">
          不審なアクセスを発見した場合は、すぐにパスワードを変更し、二段階認証を有効にしてください。
        </p>
        <div className="flex gap-2">
          <Link href="/account/security/pass" className="flex-1 text-center bg-primary text-white text-sm font-bold rounded-lg py-2">
            パスワードを変更
          </Link>
          <Link href="/account/security/2fa" className="flex-1 text-center border border-gray-300 text-sm font-semibold rounded-lg py-2">
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
