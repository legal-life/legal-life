"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { regSession } from "@/lib/auth/session";
import { getSid } from "@/lib/auth/utils";
import { relDate } from "@/lib/auth/format";

type SessionDoc = {
  sessionId: string;
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  lastActive?: unknown;
  shouldLogout?: boolean;
};

export default function DevicePage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null);
  const [error, setError] = useState("");
  const currentSid = typeof window !== "undefined" ? getSid() : "";

  const load = async (u: User) => {
    const db = getFirebaseDb();
    await regSession(u, db);
    try {
      const q = query(collection(db, "users", u.uid, "sessions"), orderBy("lastActive", "desc"), limit(10));
      const snap = await getDocs(q);
      const active = snap.docs
        .map((d) => d.data() as SessionDoc)
        .filter((d) => !d.shouldLogout || d.sessionId === currentSid);
      setSessions(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
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
    const db = getFirebaseDb();
    await setDoc(doc(db, "users", user.uid, "sessions", sid), { shouldLogout: true }, { merge: true });
    setSessions((prev) => prev?.filter((s) => s.sessionId !== sid) ?? null);
  };

  const logoutAllOthers = async () => {
    if (!user || !sessions) return;
    const others = sessions.filter((s) => s.sessionId !== currentSid);
    if (!others.length) return alert("他にアクティブな端末はありません");
    if (!confirm(`${others.length}台の端末からログアウトしますか?`)) return;
    const db = getFirebaseDb();
    await Promise.allSettled(
      others.map((s) => setDoc(doc(db, "users", user.uid, "sessions", s.sessionId), { shouldLogout: true }, { merge: true })),
    );
    setSessions(sessions.filter((s) => s.sessionId === currentSid));
  };

  if (!user) return null;

  const hasOthers = !!sessions?.some((s) => s.sessionId !== currentSid);

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
            const isCur = s.sessionId === currentSid;
            return (
              <div
                key={s.sessionId}
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
                    {s.location || "不明"} · {s.lastActive ? relDate(s.lastActive as never) : "不明"}
                  </p>
                </div>
                {!isCur && (
                  <button
                    className="shrink-0 whitespace-nowrap text-[13px] font-bold text-primary-dark rounded-md px-2.5 py-1.5 hover:bg-[#f0fafc]"
                    onClick={() => logoutSession(s.sessionId)}
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
