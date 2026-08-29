-- Phase 1: Row Level Security policies for legal-life

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.security_2fa enable row level security;
alter table public.backup_codes enable row level security;
alter table public.activity_log enable row level security;
alter table public.notification_settings enable row level security;
alter table public.access_logs enable row level security;
alter table public.announcements enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.history enable row level security;
alter table public.contents enable row level security;

-- profiles: owner can read/update own row; admins can read/update any (role management)
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- sessions: owner manages own device list (select/update needed for remote logout + SessionWatcher)
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);

-- security_2fa: owner only
create policy "security_2fa_all_own" on public.security_2fa
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- backup_codes: owner only
create policy "backup_codes_all_own" on public.backup_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- activity_log: owner can read/insert own entries (immutable log, no update/delete policy)
create policy "activity_log_select_own" on public.activity_log
  for select using (auth.uid() = user_id);
create policy "activity_log_insert_own" on public.activity_log
  for insert with check (auth.uid() = user_id);

-- notification_settings: owner only
create policy "notification_settings_all_own" on public.notification_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- access_logs: anonymous analytics writes allowed from anyone; only admins can read
create policy "access_logs_insert_anyone" on public.access_logs
  for insert with check (true);
create policy "access_logs_select_admin" on public.access_logs
  for select using (public.is_admin());

-- announcements: public can read active ones; admins manage all
create policy "announcements_select_active" on public.announcements
  for select using (active = true or public.is_admin());
create policy "announcements_write_admin" on public.announcements
  for insert with check (public.is_admin());
create policy "announcements_update_admin" on public.announcements
  for update using (public.is_admin());
create policy "announcements_delete_admin" on public.announcements
  for delete using (public.is_admin());

-- contact_inquiries: anyone can submit; only admins can read/triage
create policy "contact_inquiries_insert_anyone" on public.contact_inquiries
  for insert with check (true);
create policy "contact_inquiries_select_admin" on public.contact_inquiries
  for select using (public.is_admin());
create policy "contact_inquiries_update_admin" on public.contact_inquiries
  for update using (public.is_admin());

-- history: public read; admins manage
create policy "history_select_all" on public.history
  for select using (true);
create policy "history_write_admin" on public.history
  for insert with check (public.is_admin());
create policy "history_update_admin" on public.history
  for update using (public.is_admin());
create policy "history_delete_admin" on public.history
  for delete using (public.is_admin());

-- contents: public read published rows; admins manage everything including drafts
create policy "contents_select_published" on public.contents
  for select using (status = 'published' or public.is_admin());
create policy "contents_write_admin" on public.contents
  for insert with check (public.is_admin());
create policy "contents_update_admin" on public.contents
  for update using (public.is_admin());
create policy "contents_delete_admin" on public.contents
  for delete using (public.is_admin());
