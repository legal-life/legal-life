-- 強制ログアウト(should_logout: false→true)の監査ログをactivity_logに記録する
--
-- 背景: /account/device の「ログアウト」「他のすべての端末をログアウト」は、対象セッション行の
--   should_logout を true に更新することで実現している(components/SessionWatcher.tsx がRealtimeで
--   検知しサインアウトする)。しかしこの操作自体は activity_log に一切記録されておらず、
--   /account/activity ページ(自身のアクティビティ履歴の可視化機能)では「いつ・どの端末が
--   強制ログアウトされたか」を後から確認する手段がなかった。これはRound1・2で対応した
--   should_logout の不正な巻き戻し防止(restrict_session_self_update)と対になる、監査証跡面での
--   ギャップである。
--
-- 対策: sessions の AFTER UPDATE トリガーで should_logout が false→true に変化した行を検知し、
--   その行の user_id 宛に activity_log へ 'logout' タイプの記録を追加する。SECURITY DEFINERで
--   RLSをバイパスして挿入する(activity_logへのINSERTは行の所有者本人のみ許可されており、
--   このトリガーは他人のセッションを操作するものではないため、なりすまし挿入は発生しない。
--   new.user_id は restrict_session_self_update トリガーにより変更不可であることが保証されている)。
--   既にshould_logout=trueの行への再更新(false→false, true→true)では記録を追加しない。

create or replace function public.log_session_forced_logout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.should_logout = false and new.should_logout = true then
    insert into public.activity_log (user_id, type, detail, browser, os, device)
    values (
      new.user_id,
      'logout',
      'リモートログアウトを要求: ' || coalesce(new.device, new.browser, '不明な端末'),
      new.browser,
      new.os,
      new.device
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_log_forced_logout on public.sessions;

create trigger sessions_log_forced_logout
  after update on public.sessions
  for each row
  execute function public.log_session_forced_logout();

-- トリガー関数としてのみ使用される内部実装のため、prevent_role_self_escalation()や
-- restrict_session_self_update()と同様に、PostgREST経由でのRPCとしての直接実行権限を剥奪する
-- (SECURITY DEFINER Advisor対策)。
revoke execute on function public.log_session_forced_logout() from public;
revoke execute on function public.log_session_forced_logout() from anon;
revoke execute on function public.log_session_forced_logout() from authenticated;
