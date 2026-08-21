import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { encR } from "./utils";

export function requireAuth(): Promise<User> {
  return new Promise((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      subscription.unsubscribe();
      const user = session?.user;
      if (!user) {
        if (location.pathname.startsWith("/account/login")) return;
        window.location.replace(`/account/login?r=${encR(location.pathname + location.search)}`);
      } else {
        resolve(user);
      }
    });
  });
}
