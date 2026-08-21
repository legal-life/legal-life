import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Falls back to a syntactically valid placeholder so a missing env var
// (e.g. during a build without secrets configured) can't crash every
// page's prerender — createClient() throws immediately on an empty URL.
// Requests just fail at call time instead, same as the old Firebase
// client's lazy-init behavior when its config was unset.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient<Database>(url, anonKey);
