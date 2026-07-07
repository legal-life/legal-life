"use client";

import { useEffect } from "react";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { SESSION_KEY } from "@/lib/auth/utils";

// 旧important.jsのAuthManager._watchSession相当。
// 他端末の「デバイス管理」からログアウトさせると、該当セッションのshouldLogoutが
// trueになるので、それをリアルタイム監視して自動的にサインアウトする。
export default function SessionWatcher() {
  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubSession: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSession) {
        unsubSession();
        unsubSession = null;
      }
      if (!user) return;

      const sid = localStorage.getItem(SESSION_KEY);
      if (!sid) return;

      const db = getFirebaseDb();
      const ref = doc(db, "users", user.uid, "sessions", sid);
      unsubSession = onSnapshot(ref, (snap) => {
        if (snap.exists() && snap.data().shouldLogout === true) {
          localStorage.removeItem(SESSION_KEY);
          deleteDoc(ref)
            .catch(() => {})
            .finally(() => {
              signOut(auth).then(() => window.location.replace("/"));
            });
        }
      });
    });

    return () => {
      unsubAuth();
      unsubSession?.();
    };
  }, []);

  return null;
}
