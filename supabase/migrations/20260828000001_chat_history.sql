-- チャット履歴(ログイン中のみSupabaseに保存。未ログイン時はブラウザのlocalStorageのまま)
create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  created_at timestamptz not null default now()
);

create index chat_history_user_id_created_at_idx on public.chat_history(user_id, created_at desc);

alter table public.chat_history enable row level security;

create policy "chat_history_select_own" on public.chat_history
  for select using (auth.uid() = user_id);
create policy "chat_history_insert_own" on public.chat_history
  for insert with check (auth.uid() = user_id);
create policy "chat_history_delete_own" on public.chat_history
  for delete using (auth.uid() = user_id);

-- 最終アクセス(作成)から6ヶ月(180日)経過したチャット履歴を自動削除
select cron.schedule(
  'purge_old_chat_history',
  '0 18 * * *', -- 03:00 JST
  $$delete from public.chat_history where created_at < now() - interval '180 days'$$
);
