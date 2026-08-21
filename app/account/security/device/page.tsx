"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { regSession } from "@/lib/auth/session";
import { getSid } from "@/lib/auth/utils";
import { relDate } from "@/lib/auth/format";

type SessionRow = {
  id: string;
  browser: string | null;
  os: string | null;
  device: string | null;
  location: string | null;
  last_active: string;
  should_logout: boolean;
};

export default function DevicePage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState("");
  const currentSid = typeof window !== "undefined" ? getSid() : "";

  const load = async (u: User) => {
    await regSession(u);
    const { data, error } = await supabase
      .from("sessions")
      .select("id, browser, os, device, location, last_active, should_logout")
      .eq("user_id", u.id)
      .order("last_active", { ascending: false })
      .limit(10);
    if (error) {
      setError(error.message);
      return;
    }
    setSessions((data ?? []).filter((s) => !s.should_logout || s.id === currentSid));
  };

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      await load(u);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logoutSession = async (sid: string) => {
    if (!user || !confirm("この端末からログアウトしますか?")) return;
    await supabase.from("sessions").update({ should_logout: true }).eq("id", sid).eq("user_id", user.id);
    setSessions((prev) => prev?.filter((s) => s.id !== sid) ?? null);
  };

  const logoutAllOthers = async () => {
    if (!user || !sessions) return;
    const others = sessions.filter((s) => s.id !== currentSid);
    if (!others.length) return alert("他にアクティブな端末はありません");
    if (!confirm(`${others.length}台の端末からログアウトしますか?`)) return;
    await supabase
      .from("sessions")
      .update({ should_logout: true })
      .in("id", others.map((s) => s.id))
      .eq("user_id", user.id);
    setSessions(sessions.filter((s) => s.id === currentSid));
  };

  if (!user) return null;

  const hasOthers = !!sessions?.some((s) => s.id !== currentSid);

  return (
    <div className="w-full max-w-[640px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">ログイン中のデバイス</h1>
      <p className="text-sm text-gray-500 mb-5">現在アクティブなセッション一覧</p>

      {error && <p className="text-sm text-[#e74c3c]">読み込みに失敗しました</p>}
      {!error && sessions === null && <p className="text-sm text-gray-400">読み込み中...</p>}
      {!error && sessions?.length === 0 && <p className="text-sm text-gray-400">セッション情報がありません</p>}

      {!!sessions?.length && (
        <div className="border-t border-[#dadce0]">
          {sessions.map((s) => {
            const isCur = s.id === currentSid;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3.5 py-4 border-b border-[#dadce0] flex-wrap ${isCur ? "bg-[#f8faff] -mx-9 px-9" : ""}`}
              >
                <span className="text-2xl shrink-0">💻</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center">
                    {s.browser || "不明"} / {s.os || "不明"}
                    {isCur && (
                      <span className="ml-1.5 inline-block text-[11px] font-bold bg-[#e8f5e9] text-[#2e7d32] rounded-full px-2 py-0.5">
                        現在の端末
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.location || "不明"} · {s.last_active ? relDate(s.last_active) : "不明"}
                  </p>
                </div>
                {!isCur && (
                  <button
                    className="shrink-0 whitespace-nowrap text-[13px] font-bold text-primary-dark rounded-md px-2.5 py-1.5 hover:bg-[#f0fafc]"
                    onClick={() => logoutSession(s.id)}
                  >
                    ログアウト
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasOthers && (
        <button
          className="w-full mt-5 bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold rounded-lg py-2.5 text-sm"
          onClick={logoutAllOthers}
        >
          他のすべての端末をログアウト
        </button>
      )}

      <div className="mt-5">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
