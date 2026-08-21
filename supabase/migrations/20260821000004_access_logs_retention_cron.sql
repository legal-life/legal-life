-- Daily purge of access_logs older than 90 days (replaces the old client-driven RTDB cleanup).
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'purge_old_access_logs',
  '0 18 * * *', -- 03:00 JST
  $$delete from public.access_logs where occurred_at < now() - interval '90 days'$$
);
