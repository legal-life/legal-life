"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { SESSION_KEY } from "@/lib/auth/utils";

// 他端末の「デバイス管理」からログアウトさせると、該当セッションのshould_logoutが
// trueになるので、それをSupabase Realtimeで監視して自動的にサインアウトする。
export default function SessionWatcher() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      channel?.unsubscribe();
      channel = null;

      const user = session?.user;
      if (!user) return;

      const sid = localStorage.getItem(SESSION_KEY);
      if (!sid) return;

      channel = supabase
        .channel(`session-watch-${sid}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sid}` },
          (payload) => {
            if (payload.new.should_logout === true) {
              localStorage.removeItem(SESSION_KEY);
              supabase
                .from("sessions")
                .delete()
                .eq("id", sid)
                .then(() => {
                  supabase.auth.signOut().then(() => window.location.replace("/"));
                });
            }
          },
        )
        .subscribe();
    });

    return () => {
      subscription.unsubscribe();
      channel?.unsubscribe();
    };
  }, []);

  return null;
}
