-- 独自メールOTPベースの2FA実装をSupabase Auth標準MFA(TOTP)に一本化したため、
-- 旧実装専用だったテーブルを削除する。両テーブルともデータは0件であることを確認済み。
drop table if exists public.security_2fa;
drop table if exists public.backup_codes;
