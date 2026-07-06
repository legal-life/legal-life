import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { encR } from "./utils";

export function requireAuth(): Promise<User> {
  const auth = getFirebaseAuth();
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        if (location.pathname.startsWith("/account/login")) return;
        window.location.replace(`/account/login?r=${encR(location.pathname + location.search)}`);
      } else {
        resolve(user);
      }
    });
  });
}
