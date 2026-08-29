-- Fix advisor warnings: pin search_path, and lock down handle_new_user
-- (it must only ever run via the auth.users insert trigger, not as a public RPC)

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
