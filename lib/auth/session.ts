import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { fetchLocation, parseUA } from "@/lib/browserInfo";
import { getSid, SESSION_KEY } from "./utils";

export async function logAct(uid: string, type: string, detail = "") {
  const ua = parseUA();
  try {
    await supabase.from("activity_log").insert({
      user_id: uid,
      type,
      detail,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
    });
  } catch {
    /* ignore */
  }
}

export async function regSession(user: Pick<User, "id">) {
  const sid = getSid();
  const ua = parseUA();
  try {
    const { data: existing } = await supabase.from("sessions").select("id").eq("id", sid).maybeSingle();
    if (!existing) {
      const loc = await fetchLocation();
      await supabase.from("sessions").insert({
        id: sid,
        user_id: user.id,
        browser: ua.browser,
        os: ua.os,
        device: ua.device,
        location: loc.country,
      });
    } else {
      await supabase.from("sessions").update({ last_active: new Date().toISOString() }).eq("id", sid);
    }
  } catch {
    /* ignore */
  }
}

export async function delSession(user: Pick<User, "id">) {
  try {
    const sid = localStorage.getItem(SESSION_KEY);
    if (sid) {
      await supabase.from("sessions").delete().eq("id", sid).eq("user_id", user.id);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}
