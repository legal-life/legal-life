import { supabase } from "@/lib/supabase/client";

export type Profile = {
  display_name: string | null;
  photo_url: string | null;
  role: string;
  deletion_pending: boolean;
  scheduled_deletion: string | null;
};

export async function getProfile(uid: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, photo_url, role, deletion_pending, scheduled_deletion")
    .eq("id", uid)
    .maybeSingle();
  return data;
}

export async function updateDisplayName(uid: string, name: string) {
  await supabase.from("profiles").update({ display_name: name }).eq("id", uid);
}

export async function setDeletionPending(uid: string, pending: boolean) {
  await supabase
    .from("profiles")
    .update({
      deletion_pending: pending,
      scheduled_deletion: pending ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
      deletion_request_at: pending ? new Date().toISOString() : null,
    })
    .eq("id", uid);
}
