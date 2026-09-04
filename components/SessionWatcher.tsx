"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { SESSION_KEY } from "@/lib/auth/utils";

// 他端末の「デバイス管理」からログアウトさせると、該当セッションのshould_logoutが
// trueになるので、それをSupabase Realtimeで監視して自動的にサインアウトする。
//
// RealtimeのWebSocketは、スリープ復帰・ネットワーク切替・タブのバックグラウンド化などで
// 切断されうる。ライブラリ自体は再接続を試みるが、CHANNEL_ERROR/TIMED_OUT/CLOSEDで
// 購読が失われた場合に自動で再購読される保証はなく、その間に届いたshould_logoutの
// UPDATEイベントは静かに失われてしまう(=強制ログアウトが効かなくなる)。
// そのため、Realtimeを主経路としつつ、一定間隔でshould_logoutを直接ポーリングする
// フォールバックを保険として併用する。
const POLL_INTERVAL_MS = 60_000;

export default function SessionWatcher() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const forceLogout = (sid: string) => {
      localStorage.removeItem(SESSION_KEY);
      supabase
        .from("sessions")
        .delete()
        .eq("id", sid)
        .then(() => {
          supabase.auth.signOut().then(() => window.location.replace("/"));
        });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      channel?.unsubscribe();
      channel = null;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }

      const user = session?.user;
      if (!user) return;

      const sid = localStorage.getItem(SESSION_KEY);
      if (!sid) return;

      pollTimer = setInterval(async () => {
        const { data } = await supabase.from("sessions").select("should_logout").eq("id", sid).maybeSingle();
        if (!cancelled && data?.should_logout === true) forceLogout(sid);
      }, POLL_INTERVAL_MS);

      channel = supabase
        .channel(`session-watch-${sid}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sid}` },
          (payload) => {
            if (payload.new.should_logout === true) forceLogout(sid);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      channel?.unsubscribe();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  return null;
}
