"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { regSession } from "@/lib/auth/session";
import { getSid } from "@/lib/auth/utils";
import { relDate } from "@/lib/auth/format";
import { IconLaptop } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";

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
  const [actionError, setActionError] = useState("");
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
    // 更新失敗時にもリストから消してしまうと、実際にはログアウトされていない
    // 端末を「ログアウト済み」と誤認させてしまう(セキュリティ上望ましくない)ため、
    // 成功を確認してからUIを更新する。
    setActionError("");
    const { error } = await supabase.from("sessions").update({ should_logout: true }).eq("id", sid).eq("user_id", user.id);
    if (error) {
      setActionError("ログアウトに失敗しました: " + error.message);
      return;
    }
    setSessions((prev) => prev?.filter((s) => s.id !== sid) ?? null);
  };

  const logoutAllOthers = async () => {
    if (!user || !sessions) return;
    const others = sessions.filter((s) => s.id !== currentSid);
    if (!others.length) return alert("他にアクティブな端末はありません");
    if (!confirm("他のすべての端末からログアウトしますか?")) return;
    setActionError("");
    // 一覧は表示用に最新10件までしか読み込んでいないため、その中の
    // id だけを対象に更新すると11台目以降のセッションが取りこぼされ、
    // 「他のすべての端末をログアウト」という説明と実際の挙動が食い違ってしまう。
    // user_id + 現在のセッションID以外、という条件で直接更新することで
    // 一覧に表示しきれていないセッションも確実に対象にする。
    const { error } = await supabase
      .from("sessions")
      .update({ should_logout: true })
      .eq("user_id", user.id)
      .neq("id", currentSid);
    if (error) {
      setActionError("ログアウトに失敗しました: " + error.message);
      return;
    }
    setSessions(sessions.filter((s) => s.id === currentSid));
  };

  if (!user) return null;

  const hasOthers = !!sessions?.some((s) => s.id !== currentSid);

  return (
    <MdAccountCard
      backHref="/account"
      backLabel="アカウント設定に戻る"
      title="ログイン中のデバイス"
      subtitle="現在アクティブなセッション一覧"
      maxWidthClassName="max-w-[640px]"
    >
      {error && <p className="text-m3-body-medium text-md-error">読み込みに失敗しました</p>}
      {actionError && <p className="text-m3-body-medium text-md-error mb-2">{actionError}</p>}
      {!error && sessions === null && <p className="text-m3-body-medium text-md-on-surface-variant">読み込み中...</p>}
      {!error && sessions?.length === 0 && <p className="text-m3-body-medium text-md-on-surface-variant">セッション情報がありません</p>}

      {!!sessions?.length && (
        <div className="space-y-2">
          {sessions.map((s) => {
            const isCur = s.id === currentSid;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-3.5 py-4 px-4 rounded-m3-md flex-wrap ${isCur ? "bg-md-primary-container" : "bg-md-surface-container"}`}
              >
                <IconLaptop className={`w-6 h-6 shrink-0 ${isCur ? "text-md-on-primary-container" : "text-md-on-surface-variant"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-m3-body-medium font-semibold flex items-center ${isCur ? "text-md-on-primary-container" : "text-md-on-surface"}`}>
                    {s.browser || "不明"} / {s.os || "不明"}
                    {isCur && (
                      <span className="ml-1.5 inline-block text-[11px] font-bold bg-md-primary text-md-on-primary rounded-full px-2 py-0.5">
                        現在の端末
                      </span>
                    )}
                  </p>
                  <p className={`text-m3-body-small mt-0.5 ${isCur ? "text-md-on-primary-container" : "text-md-on-surface-variant"}`}>
                    {s.location || "不明"} · {s.last_active ? relDate(s.last_active) : "不明"}
                  </p>
                </div>
                {!isCur && (
                  <button
                    className="shrink-0 whitespace-nowrap text-m3-label-large font-medium text-md-primary rounded-m3-sm px-2.5 py-1.5 hover:bg-md-primary/8"
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
        <MdButton
          variant="filled"
          className="w-full mt-5 !bg-md-error !text-md-on-error"
          onClick={logoutAllOthers}
        >
          他のすべての端末をログアウト
        </MdButton>
      )}

      <div className="text-center mt-5">
        <Link href="/account" className="text-m3-body-medium text-md-on-surface-variant">アカウント設定に戻る</Link>
      </div>
    </MdAccountCard>
  );
}
