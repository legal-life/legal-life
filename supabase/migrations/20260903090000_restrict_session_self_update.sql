-- sessions テーブルのUPDATEにおける、所有者によるカラム単位の不正操作を防止する
--
-- 問題: sessions_update_own ポリシー(USING/WITH CHECK とも `auth.uid() = user_id`のみ)
--   は「行の所有者本人か」しかチェックしておらず、更新可能なカラムを制限していない。
--   これはRound 1で修正した profiles.role の権限昇格パターンと同種の脆弱性で、
--   影響は以下の通り:
--
--   1. should_logout の巻き戻し(強制ログアウトの回避):
--      デバイス管理ページ(/account/device)の「ログアウト」「他のすべての端末を
--      ログアウト」機能は、対象セッション行の should_logout を true に更新することで
--      実現している(components/SessionWatcher.tsx がRealtimeで検知しサインアウトする)。
--      しかし sessions_update_own ポリシーはカラムを制限していないため、
--      セッショントークンを盗んだ攻撃者が
--        PATCH /rest/v1/sessions?id=eq.<盗んだセッションID>  body: {"should_logout": false}
--      を自分自身のトークンで直接叩くだけで、正規ユーザーが実行した強制ログアウトを
--      いつでも打ち消せてしまう。これはセッション乗っ取りへの対抗手段そのものを
--      無効化できることを意味し、影響度が高い。
--
--   2. browser/os/device/location/login_at の偽装(不正端末の隠蔽):
--      デバイス管理ページはこれらのカラムを「見覚えのない端末を発見するための
--      セキュリティ機能」として表示している。しかし同ポリシーはこれらのカラムも
--      自由な書き換えを許してしまうため、攻撃者が乗っ取ったセッションの表示情報を
--      正規ユーザーの見慣れた端末情報に偽装し、発見を逃れることができてしまう。
--
-- 対策: BEFORE UPDATE トリガーで、PostgREST経由(anon/authenticated)からの更新について
--   (a) browser/os/device/location/login_at/user_id の変更を一切禁止し、
--   (b) should_logout は false→true の一方向にのみ許可し、true→false への巻き戻しを禁止する。
--   last_active のみは自由に更新可能(ハートビート用途)。
--   PostgRESTを介さない直接のDB接続およびservice_roleは、prevent_role_self_escalation()と
--   同様に従来通り操作できるよう素通りさせる。

create or replace function public.restrict_session_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- PostgRESTを介さない直接のDB接続(Studio SQL Editor等)はスルーする
  if auth.role() is null then
    return new;
  end if;

  -- service_role(サーバー側の管理スクリプト)は許可する
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- 上記以外(anon/authenticated からの PostgREST 経由リクエスト)は、
  -- last_active と should_logout(false→trueのみ)以外のカラム変更を拒否する
  if new.user_id is distinct from old.user_id
     or new.browser is distinct from old.browser
     or new.os is distinct from old.os
     or new.device is distinct from old.device
     or new.location is distinct from old.location
     or new.login_at is distinct from old.login_at then
    raise exception 'insufficient_privilege: this column cannot be modified by the session owner'
      using errcode = '42501';
  end if;

  if old.should_logout = true and new.should_logout = false then
    raise exception 'insufficient_privilege: should_logout cannot be reverted from true to false by the session owner'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_restrict_self_update on public.sessions;

create trigger sessions_restrict_self_update
  before update on public.sessions
  for each row
  execute function public.restrict_session_self_update();

-- トリガー関数としてのみ使用される内部実装のため、prevent_role_self_escalation()と同様に
-- PostgREST経由でのRPCとしての直接実行権限を剥奪する(SECURITY DEFINER Advisor対策)。
revoke execute on function public.restrict_session_self_update() from public;
revoke execute on function public.restrict_session_self_update() from anon;
revoke execute on function public.restrict_session_self_update() from authenticated;
