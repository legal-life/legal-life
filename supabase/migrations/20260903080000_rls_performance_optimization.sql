-- Supabase Performance Advisorの指摘への対応。
-- 1. RLSポリシー内のauth.uid()を(select auth.uid())でラップし、
--    クエリごとに1回評価されるようにする(元は行ごとに再評価されていた= auth_rls_initplan)。
-- 2. profilesテーブルのUPDATEで冗長だった2つのpermissiveポリシー
--    (profiles_update_own / profiles_update_admin)を1本に統合し、
--    UPDATEのたびに2ポリシーが評価される無駄をなくす(multiple_permissive_policies)。
-- 挙動(誰が読み書きできるか)は変更しない。

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using ((select auth.uid()) = id or public.is_admin())
  with check ((select auth.uid()) = id or public.is_admin());

-- sessions
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own" on public.sessions
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own" on public.sessions
  for delete using ((select auth.uid()) = user_id);

-- activity_log
drop policy if exists "activity_log_select_own" on public.activity_log;
create policy "activity_log_select_own" on public.activity_log
  for select using ((select auth.uid()) = user_id);

drop policy if exists "activity_log_insert_own" on public.activity_log;
create policy "activity_log_insert_own" on public.activity_log
  for insert with check ((select auth.uid()) = user_id);

-- notification_settings
drop policy if exists "notification_settings_all_own" on public.notification_settings;
create policy "notification_settings_all_own" on public.notification_settings
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- chat_history
drop policy if exists "chat_history_select_own" on public.chat_history;
create policy "chat_history_select_own" on public.chat_history
  for select using ((select auth.uid()) = user_id);

drop policy if exists "chat_history_insert_own" on public.chat_history;
create policy "chat_history_insert_own" on public.chat_history
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "chat_history_delete_own" on public.chat_history;
create policy "chat_history_delete_own" on public.chat_history
  for delete using ((select auth.uid()) = user_id);
