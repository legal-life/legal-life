"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { delSession, logAct } from "@/lib/auth/session";

export default function LogoutPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        if (u) {
          await Promise.allSettled([logAct(u.id, "logout", ""), delSession(u)]);
        }
        await supabase.auth.signOut();
        sessionStorage.removeItem("ll_auth_cache");
        setDone(true);
        setTimeout(() => window.location.replace("/"), 3000);
      } catch {
        window.location.replace("/");
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-[520px] rounded-m3-lg bg-md-surface-container-lowest p-9 shadow-m3-1 text-center">
        {!done ? (
          <>
            <p className="text-m3-title-large font-bold text-md-on-surface">ログアウト中...</p>
            <p className="text-m3-body-medium text-md-on-surface-variant mt-2">しばらくお待ちください</p>
          </>
        ) : (
          <>
            <p className="text-m3-title-large font-bold text-md-on-surface">ログアウトしました</p>
            <p className="text-m3-body-medium text-md-on-surface-variant mt-2">3秒後にトップページへ移動します...</p>
            <div className="mt-5">
              <Link href="/" className="text-md-primary font-semibold text-m3-body-medium">今すぐトップへ戻る</Link>
            </div>
          </>
        )}
    </div>
  );
}
