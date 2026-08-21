import { supabase } from "@/lib/supabase/client";

export const BACKUP_CODE_COUNT = 10;

export type BackupCode = { code: string; used: boolean };

function genCode(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

export async function genAndSaveCodes(uid: string): Promise<BackupCode[]> {
  await supabase.from("backup_codes").delete().eq("user_id", uid);
  const codes: BackupCode[] = Array.from({ length: BACKUP_CODE_COUNT }, () => ({ code: genCode(), used: false }));
  await supabase.from("backup_codes").insert(codes.map((c) => ({ user_id: uid, code: c.code, used: false })));
  return codes;
}

export async function loadCodes(uid: string): Promise<BackupCode[]> {
  const { data } = await supabase
    .from("backup_codes")
    .select("code, used")
    .eq("user_id", uid)
    .order("generated_at");
  if (data && data.length > 0) return data;
  return genAndSaveCodes(uid);
}
