-- profiles.role の権限昇格(privilege escalation)を防止する
--
-- 問題: profiles_update_own_or_admin ポリシー(USING/WITH CHECK とも
--   `auth.uid() = id OR is_admin()`)は「行の所有者本人か管理者か」しか
--   検証しておらず、更新可能なカラムを制限していない。そのため、
--   ログイン済みの一般ユーザーが PostgREST 経由で
--     PATCH /rest/v1/profiles?id=eq.<自分のuid>  body: {"role":"admin"}
--   を直接叩くだけで、自分自身に管理者権限を付与できてしまう
--   (フロントエンドのUIが制限していても、RLSポリシー自体はAPIレベルの
--   直接呼び出しを防げない)。現時点でprofilesテーブルに管理者は
--   1人も存在せず、実際に誰でもこの経路で管理者になれる状態だった。
--
-- 対策: BEFORE UPDATE トリガーで role カラムの変更を検知し、
--   呼び出し元が既に管理者(is_admin())の場合のみ許可する。
--   PostgRESTを介さない直接のDB接続(SQL Editor等、既にDB管理者権限を
--   持つ経路)およびservice_role(サーバー側の管理スクリプト)は
--   従来通り操作できるよう、auth.role()が設定されていない/または
--   service_roleの場合はチェックを素通りさせる。

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- role カラムが変更されようとしている場合のみチェックする
  if new.role is distinct from old.role then
    -- PostgRESTを介さない直接のDB接続(Studio SQL Editor等)はスルーする
    if auth.role() is null then
      return new;
    end if;

    -- service_role(サーバー側の管理スクリプト)は許可する
    if auth.role() = 'service_role' then
      return new;
    end if;

    -- 上記以外(anon/authenticated からの PostgREST 経由リクエスト)は、
    -- 呼び出し元が既に管理者である場合のみ role の変更を許可する
    if not public.is_admin() then
      raise exception 'insufficient_privilege: role can only be changed by an admin'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_escalation();

-- prevent_role_self_escalation() はトリガー関数としてのみ使用される内部実装であり、
-- is_admin() のようにRLSポリシー式の中でanon/authenticatedから直接評価される必要はない。
-- デフォルトではpublicスキーマの関数はPostgREST経由でRPCとして誰でも呼び出し可能になって
-- しまう(SECURITY DEFINER Advisorの新規WARN)ため、外部からのRPC実行権限を明示的に剥奪する。
-- (トリガーとしての発火はテーブルへのUPDATE権限で制御されるため、EXECUTE権限の剥奪後も
-- トリガー自体は正常に動作する)
revoke execute on function public.prevent_role_self_escalation() from public;
revoke execute on function public.prevent_role_self_escalation() from anon;
revoke execute on function public.prevent_role_self_escalation() from authenticated;
