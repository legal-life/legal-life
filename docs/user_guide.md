# ユーザー対応ガイド

このドキュメントは、コード側の対応だけでは完結せず、**ユーザー様ご自身の操作が必要な項目**をまとめたものです。Supabase・Vercel・Cloudflare・Google関連のダッシュボード設定など、AIエージェントからは実行できない(または実行すべきでない)作業が対象です。

最終更新: 2026年9月2日

---

## 1. 今すぐ対応が必要なこと(優先度高)

### 1-1. Supabase: Site URLの確認

- 場所: Supabaseダッシュボード → Authentication → URL Configuration
- 内容: **Site URL** が `https://legal-life.vercel.app`(正式な本番ドメイン)になっていること
- 背景: 以前 Site URL が `legal-life-saka2931.vercel.app`(Vercelの自動生成ドメイン)を向いていたため、確認メールのリンクが誤ったドメインにリダイレクトされていました。既に修正いただいた旨ご報告いただいていますが、念のため最終確認をお願いします
- あわせて Redirect URLs に `https://legal-life.vercel.app/**` が登録されているかもご確認ください

### 1-2. Supabase: Googleログインの有効化

- 場所: Supabaseダッシュボード → Authentication → Providers → Google
- 内容: トグルを有効化し、以下を登録
  - Google Cloud Console で発行した OAuth クライアント ID
  - 対応するクライアントシークレット
- Google Cloud Console 側で必要な設定:
  - 承認済みのリダイレクト URI に `https://hsghtqqfhrxutpogqpys.supabase.co/auth/v1/callback` を追加
- これが未設定の間は、Googleログインで「Provider (issuer "https://accounts.google.com") is not enabled」エラーが発生し続けます

### 1-3. Vercel: 環境変数の設定

Google Cloud・Google Analyticsを再設定された場合、新しい値をVercelの環境変数に設定してください(下部の「環境変数一覧」を参照)。特に以下は今回のPRでハードコードから環境変数化しました:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`(Google One Tap用。1-2のOAuthクライアントIDと同じ値)

### 1-4. Supabase: Custom SMTP(Gmail)の設定

Resendの利用を取りやめ、メール送信をGmail SMTPに一本化しました。このアプリ自身が送るメール(お問い合わせ通知・会員向け通知メール)は既にGmail SMTPを使っていますが、**Supabase Auth自体が送るメール**(サインアップ確認・パスワードリセット・メールアドレス変更確認など)は別設定が必要です。

- 場所: Supabaseダッシュボード → Authentication → Emails → SMTP Settings
- 「Enable Custom SMTP」を有効化し、以下を入力:

| 項目 | 値 |
| --- | --- |
| Sender email | `GMAIL_USER`と同じGmailアドレス |
| Sender name | 任意(例: legal&life) |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `GMAIL_USER`と同じGmailアドレス |
| Password | `GMAIL_APP_PASSWORD`と同じアプリパスワード |

- Gmailはgoogle.comという検証済みドメインを使うため、Resendのような独自ドメイン検証は不要です
- 未設定の間はSupabaseのデフォルト送信元(無料枠・低いレート制限)が使われ続けます
- コード側のResend連携(配信リスト同期機能)は削除済みです。Resendアカウント自体を削除いただいて問題ありません

---

## 2. セキュリティ強化のための推奨設定(任意)

### 2-1. Cloudflare Turnstile(CAPTCHA)の有効化

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/)でTurnstileウィジェットを新規作成
2. **Site Key** をVercelの環境変数 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` に設定
3. **Secret Key** をSupabaseダッシュボードの Authentication → Bot and Abuse Protection に設定
4. 未設定の間はCAPTCHAウィジェット自体が表示されず、認証機能自体には影響ありません

### 2-2. 漏洩パスワード保護の有効化

- 場所: Supabaseダッシュボード → Authentication → Policies (Password)
- 「Leaked password protection」を有効化すると、HaveIBeenPwned.orgと照合し、漏洩済みパスワードの使用を防げます
- 無料・設定のみで完結します

### 2-3. レートリミットの調整

- 場所: Supabaseダッシュボード → Authentication → Rate Limits

| 項目 | 対象 | カスタマイズ可否 |
| --- | --- | --- |
| サインアップ・パスワードリセット等のメール送信 | プロジェクト全体の合計 | カスタムSMTP設定時のみ変更可 |
| OTP送信 | プロジェクト全体の合計 / ユーザーごとの間隔 | 変更可 |
| サインアップ確認・パスワードリセットの再送間隔 | ユーザーごと | 変更可 |
| 確認(verify)・トークンリフレッシュ・MFAチャレンジ | IPアドレスごと | 変更不可(固定値) |

不正利用が心配な場合は、CAPTCHAを有効化した上でOTP/確認メールの送信間隔を広げるのが効果的です。

---

## 3. 未解決の問題

### 3-1. Gmail SMTPが本番で送信できない

- 有効な `GMAIL_APP_PASSWORD` をVercelの環境変数に設定してください(1-4のSupabase Custom SMTP側にも同じ値の設定が必要です)
- お問い合わせ内容自体はメール送信の成否に関わらず `/admin/inquiries` から確認できるよう対応済みです
- Gmailの個人アカウントは送信上限が目安1日500通です。会員数が増え上限に近づく場合はGoogle Workspaceの利用をご検討ください

---

## 環境変数一覧

Vercelダッシュボードの Project Settings → Environment Variables で設定してください。

| 変数名 | 用途 | 必須 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | ○ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのpublishable(anon)キー | ○ |
| `NEXT_PUBLIC_SITE_URL` | サイトの本番URL(メタデータ・サイトマップ生成に使用)。`https://legal-life.vercel.app` | ○ |
| `GEMINI_API_KEY` | Gemini API(サーバー専用、`/api/chat`のみで参照) | ○ |
| `GMAIL_USER` | メール送信元のGmailアドレス(例: `xxxx@gmail.com`)。Supabase Custom SMTP(1-4)にも同じ値を設定 | △(現状本番で送信不可、3-1参照) |
| `GMAIL_APP_PASSWORD` | Googleアカウントの2段階認証を有効にした上で発行する「アプリパスワード」。Supabase Custom SMTP(1-4)にも同じ値を設定 | △(同上) |
| `CONTACT_TO_EMAIL` | お問い合わせフォームの送信先メールアドレス | ○ |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare TurnstileのSite Key。未設定時はCAPTCHAウィジェット非表示 | 任意(2-1参照) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4の測定ID(`G-`から始まる)。未設定時は既存IDにフォールバック | ○(再設定時は要更新) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0クライアントID(Google One Tap用、`.apps.googleusercontent.com`で終わる)。未設定時は既存IDにフォールバック。Supabase側のGoogle Provider設定にも同じ値の登録が必要(1-2参照) | ○(再設定時は要更新) |

○ = 現状必須 / △ = 機能が動作していないため優先度低め / 任意 = なくても動作する追加機能
