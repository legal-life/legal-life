"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { delSession, logAct } from "@/lib/auth/session";

export default function LogoutPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      try {
        const u = auth.currentUser;
        if (u) {
          await Promise.allSettled([logAct(u.uid, db, "logout", ""), delSession(u, db)]);
        }
        await signOut(auth);
        sessionStorage.removeItem("ll_auth_cache");
        setDone(true);
        setTimeout(() => window.location.replace("/"), 3000);
      } catch {
        window.location.replace("/");
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9 text-center">
        {!done ? (
          <>
            <p className="text-lg font-bold">ログアウト中...</p>
            <p className="text-sm text-gray-500 mt-2">しばらくお待ちください</p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold">ログアウトしました</p>
            <p className="text-sm text-gray-500 mt-2">3秒後にトップページへ移動します...</p>
            <div className="mt-5">
              <Link href="/" className="text-primary-dark font-semibold text-sm">今すぐトップへ戻る</Link>
            </div>
          </>
        )}
    </div>
  );
}
