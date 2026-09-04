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
        // encR()はBase64文字列を返すため "+" "/" "=" を含み得る。クエリ文字列に
        // そのまま埋め込むと、特に "+" が空白として再解釈されLoginForm/SignupFormの
        // decR()で壊れた値を受け取ってしまうため、encodeURIComponentで再エンコードする。
        window.location.replace(`/account/login?r=${encodeURIComponent(encR(location.pathname + location.search))}`);
      } else {
        resolve(user);
      }
    });
  });
}
