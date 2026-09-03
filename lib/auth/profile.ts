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

// 呼び出し元(プロフィール編集・削除申請ページ)はtry/catchでSupabaseエラーを
// キャッチしてユーザーに表示する前提のため、ここでエラーを握りつぶすと
// 更新が実際には失敗しているのに画面上は成功したかのように見えてしまう
// (例: アカウント削除申請が実は保存されていないのに「申請済み」画面が出る)。
// 必ずエラーをthrowして呼び出し元に伝播させる。
export async function updateDisplayName(uid: string, name: string) {
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", uid);
  if (error) throw error;
}

export async function setDeletionPending(uid: string, pending: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({
      deletion_pending: pending,
      scheduled_deletion: pending ? new Date(Date.now() + 30 * 86400000).toISOString() : null,
      deletion_request_at: pending ? new Date().toISOString() : null,
    })
    .eq("id", uid);
  if (error) throw error;
}
