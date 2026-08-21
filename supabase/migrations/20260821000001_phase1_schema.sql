-- Phase 1: initial schema for legal-life Supabase migration
-- Mirrors the Firebase data model documented in docs/session-handoff.md

create extension if not exists pgcrypto;

-- generic updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  photo_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  deletion_pending boolean not null default false,
  scheduled_deletion timestamptz,
  deletion_request_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, photo_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- helper used by RLS policies below
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- sessions (device list + forced-logout via Realtime)
-- ---------------------------------------------------------------------
create table public.sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  browser text,
  os text,
  device text,
  location text,
  login_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  should_logout boolean not null default false
);

create index sessions_user_id_idx on public.sessions(user_id);

-- ---------------------------------------------------------------------
-- security_2fa
-- ---------------------------------------------------------------------
create table public.security_2fa (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  otp_code text,
  otp_expiry timestamptz,
  otp_purpose text check (
    otp_purpose is null or otp_purpose in (
      'login_verify', '2fa_enable', '2fa_disable', 'account_delete', 'backup_regen'
    )
  )
);

-- ---------------------------------------------------------------------
-- backup_codes (one row per code, normalized from the Firestore array)
-- ---------------------------------------------------------------------
create table public.backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  used boolean not null default false,
  generated_at timestamptz not null default now(),
  unique (user_id, code)
);

create index backup_codes_user_id_idx on public.backup_codes(user_id);

-- ---------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in (
    'login', 'logout', 'signup', 'password_change', 'profile_update',
    'twofa_change', 'email_change', 'method_change', 'deletion_request'
  )),
  detail text not null default '',
  browser text,
  os text,
  device text,
  created_at timestamptz not null default now()
);

create index activity_log_user_id_created_at_idx on public.activity_log(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- notification_settings
-- ---------------------------------------------------------------------
create table public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  login boolean not null default true,
  password_change boolean not null default true,
  email_change boolean not null default true,
  otp_change boolean not null default true,
  deletion_request boolean not null default true,
  maintenance boolean not null default true,
  new_feature boolean not null default true,
  newsletter boolean not null default true
);

-- ---------------------------------------------------------------------
-- access_logs (anonymous site analytics, replaces RTDB analytics/{date}/logs)
-- ---------------------------------------------------------------------
create table public.access_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'scroll', 'engagement', 'click')),
  path text,
  occurred_at timestamptz not null default now(),
  browser text,
  os text,
  device text,
  screen text,
  lang text,
  theme text,
  country text,
  region text,
  city text,
  extra jsonb not null default '{}'::jsonb
);

create index access_logs_occurred_at_idx on public.access_logs(occurred_at);

-- ---------------------------------------------------------------------
-- announcements (header banners + /info/details pages)
-- ---------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_html text,
  severity text not null default 'info' check (severity in ('info', 'important', 'maintenance')),
  published_at date,
  show_in_header boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- contact_inquiries (お問い合わせ, previously email-only)
-- ---------------------------------------------------------------------
create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_name text not null,
  gender text,
  age_group text,
  reply_email text,
  inquiry_type text not null,
  category text,
  content text not null,
  device_info jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create index contact_inquiries_created_at_idx on public.contact_inquiries(created_at desc);

-- ---------------------------------------------------------------------
-- history (沿革)
-- ---------------------------------------------------------------------
create table public.history (
  id uuid primary key default gen_random_uuid(),
  date_label text not null,
  title text not null,
  body text not null,
  tech text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- contents (news / study, admin-managed CMS content)
-- ---------------------------------------------------------------------
create table public.contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('news', 'study')),
  category text,
  title text not null,
  body_html text,
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Realtime (SessionWatcher forced-logout watches sessions via postgres_changes)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.sessions;
