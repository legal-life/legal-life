# セッション引き継ぎメモ

新しいセッションでこのプロジェクトの作業を継続するための背景情報です。冒頭で「docs/session-handoff.mdを読んで作業を継続してください」と伝えてください。

## プロジェクト概要

- `legal-life`(このリポジトリ): Next.js 15 (App Router) + TypeScript + Tailwind CSS の法令学習・相談サイト
- 旧: Cloudflare Pagesの素のHTML/CSS/vanilla-JSサイト → 全面リライトしてVercelへ移行済み
- 旧`legal-life-mailer`(別リポジトリ)のメール送信・Audience管理機能もこのリポジトリの`/api/mail`, `/api/mail/audience`に統合済み
- `main`ブランチが最新。直近のPR(#2, #3, #4, #5)はすべてマージ済み
- `old_code`という名前のorphanブランチに、移行元の本来の静的サイトソース(`src/`配下)が保管されている。CSS/JSの突き合わせ確認をする際はここと比較する

## 現在の技術スタック

- **フロントエンド**: Next.js 15 App Router, TypeScript, Tailwind CSS(CSS変数ではなくTailwindユーティリティで元サイトの配色・レイアウトを再現)
- **フォント**: `next/font/local`で`public/assets/fonts/BIZUDGothic-Bold.ttf`を自己ホスト
- **認証・データ**: Supabase(Auth, PostgreSQL Database, Realtime)。2026-08-21セッションでFirebaseから全面移行済み
- **メール送信**: Gmail SMTP経由(Nodemailer)。`GMAIL_USER`/`GMAIL_APP_PASSWORD`。Resend等のESPはgmail.comドメインを送信元として認証できないためこの方式のみ採用。**ただし2026-08-28時点、本番環境では実際には送信できていない(構築途中で断念/未設定)。** 実際に有効なGmailアプリパスワードをVercelの環境変数に設定するか、別のメール配信手段への切替が必要。これにより2FA・パスワードリセット等のOTPコード配信、アカウント通知メールは現状本番で機能しない可能性が高い。お問い合わせフォームのみ、`app/api/mail/route.ts`でSupabase `contact_inquiries` への保存をメール送信の成否から独立させたため、送信に失敗しても問い合わせ内容自体は失われず`/admin/inquiries`から確認できる
- **配信リスト管理**: Resend Segments API(実送信はしない、リスト管理のみ)
- **AIチャット**: Gemini API(`gemini-3.5-flash`)、サーバー側`/api/chat`経由でキーを秘匿
- **法令検索**: e-Gov法令API Version2を直接クライアントから呼び出し(公開APIのため問題なし)
- **アクセス解析**: 自前実装(`components/AccessLogger.tsx`)、Supabaseの`access_logs`テーブルに書き込み。`pg_cron`で90日超データを自動クリーンアップ

## 直近やったこと(このセッション)

1. **CSS/JS移行の整合性チェック**を`old_code`ブランチと突き合わせて実施し、以下の実際の不具合を発見・修正(すべてmainにマージ済み):
   - ハンバーガーメニューが外側クリック/リンククリックで閉じない
   - お問い合わせメールに端末診断情報(ブラウザ・OS・IP等17項目)が収集されていたのに本文に反映されていなかった
   - アクセス解析のクリック計測用id/classが実際のDOM要素から抜け落ちていて計測が機能していなかった(ハンバーガーボタン、Cookie同意ボタン、ログインボタン、検索詳細ボタン)
   - チャットの削除ボタンが誤って送信ボタンと同じclassを持っていた
   - お知らせバナーのSVGアイコンが欠落していた
   - account配下ページの配色がTailwind標準色のままで、元サイトのデザイントークン(`--primary:#00c8e9`, `--danger:#e74c3c`等)と不一致だった

2. **新規Vercelプロジェクト作成を試みた**が、以下の理由で完了していない:
   - `saka2931`というVercelチームには元々`legal-life-site`チームとは別物で、GitHubアプリ連携が確立していなかった
   - ファイル直接アップロード方式はフォントファイル(約6MB)を含めるとペイロードが大きすぎて実行不可と判断し中断
   - `docs/vercel-new-project-guide.md`に手動での作成手順ガイドを作成済み(GitHub連携を先に正しく設定する方法と、Vercel CLIで`vercel login`→`vercel link`→`vercel --prod`する方法の両方を記載)
   - ユーザーが独自にVercelダッシュボードから`legal-life.vercel.app`としてプロジェクトを作成したが、`NEXT_PUBLIC_FIREBASE_CONFIG`環境変数が未設定のため`auth/invalid-api-key`エラーが発生中。**対処法(環境変数設定+Firebase承認済みドメイン追加+再デプロイ)は伝達済みだが、実行完了は未確認**

3. **Supabaseへの全面移行の計画を開始**したが、Supabase MCPツールが接続できず未着手だった(前セッション終了時点):
   - ユーザーの意向: **認証(Firebase Auth)・Firestore・RTDBも含めて完全にSupabase一本化**したい
   - 加えて管理画面(admin)で以下をSupabase駆動にしたいという要望あり:
     - お知らせの新規作成・編集・削除
     - お問い合わせ内容の一覧表示
     - 今後追加予定の学習コンテンツ・ニュースコンテンツの記述
     - 沿革の記述
   - `ListConnectors`で確認したところ、Supabaseコネクタは組織レベルでは`connected: true`だが、このセッションでは`enabledInChat: false`のまま変わらず、`ToolSearch`でSupabase系MCPツール(`mcp__Supabase__*`)を検出できなかった
   - ユーザーは「このチャット内では常に有効」と主張しており、食い違いが解消しなかったため、新しいセッションに切り替えることになった

## 直近やったこと(このセッション: 2026-08-21)

1. **新しいセッションでSupabase MCPツールが使えることを確認**(前セッションの問題は解消)。組織`deskside31`配下に新規Supabaseプロジェクト`legal-life`(project_id: `hsghtqqfhrxutpogqpys`, リージョン: `ap-northeast-1`, 無料枠)を作成した。
2. **フェーズ1(スキーマ設計)を完了**。Firebaseのデータモデルを実コード(`lib/auth/*`, `components/SessionWatcher.tsx`, `components/AccessLogger.tsx`, `app/api/mail/route.ts`等)から精査した上で、以下11テーブルを設計・適用済み(RLS有効化・ポリシー設定済み):
   - `profiles`(`auth.users`と1:1、`role`列で管理者判定。`auth.users` INSERT時に自動作成するトリガー`on_auth_user_created`あり)
   - `sessions`(デバイス一覧・強制ログアウト用。`supabase_realtime`パブリケーションに追加済み、`SessionWatcher`の`onSnapshot`をRealtimeの`postgres_changes`で置き換える想定)
   - `security_2fa`, `backup_codes`(1コードにつき1行で正規化)
   - `activity_log`, `notification_settings`
   - `access_logs`(匿名アクセス解析。旧RTDB `analytics/{date}/logs` の置き換え。90日パージは未実装、`pg_cron`等で対応予定)
   - `announcements`(ヘッダーバナー+`/info/details/[slug]`ページ両方を統合したモデル)
   - `contact_inquiries`(新規。お問い合わせは今まで永続化されておらずメール送信のみだった)
   - `history`(沿革。現状ハードコードされている`TIMELINE`の移行先)
   - `contents`(news/study共通。両方とも現状プレースホルダーUIのみで実データなし、これから設計するCMSモデル)
   - 管理者判定用ヘルパー関数`public.is_admin()`(RLSポリシー内で使用。`anon`/`authenticated`から実行可能な状態は意図的)
   - マイグレーションSQLは`supabase/migrations/`配下に3ファイルで保存済み(`20260821000001_phase1_schema.sql`, `20260821000002_phase1_rls.sql`, `20260821000003_phase1_security_fixes.sql`)。`get_advisors`のセキュリティ警告(`search_path`未固定、`handle_new_user`の意図しない公開実行)は修正済み。`is_admin()`が`anon`/`authenticated`から実行可能という警告のみ残存(RLSポリシーの正常動作に必須のため意図的に許容)。
3. **VercelプロジェクトとSupabaseの連携を試みたが未完了**:
   - `saka2931`チームでVercel MCPの`list_projects`は空を返す一方、`create_git_project`で同名プロジェクト作成を試みると409(既存)エラーになる、`get_project`は404になるという食い違いが発生。おそらく`legal-life`という名前のVercelプロジェクトは`saka2931`とは別スコープ(個人アカウント等)に存在しており、このセッションのVercel MCP接続からは操作できない。
   - ユーザーに確認したところ、「既存の`legal-life.vercel.app`を使う(ユーザー側で作業)」を選択。そのため以下の作業はユーザーに委ねる形になった:
     - Vercelダッシュボード → `legal-life`プロジェクト → Settings → Environment Variables に以下を追加
       - `NEXT_PUBLIC_SUPABASE_URL` = `https://hsghtqqfhrxutpogqpys.supabase.co`
       - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_PVBSAR21qht8JIyY5HCnEA_dQLEa1dW`
     - Settings → Git → Connect Git Repository で`sho29saka31/legal-life`を接続(未接続の場合)
     - Supabase側のGitHub連携(PRごとのDBブランチ機能)は、Supabaseダッシュボード → Settings → Integrations → GitHub からユーザー自身がOAuth操作で設定する必要がある(MCPツールでは実行不可)
   - 上記の環境変数追加・Git連携・Supabase GitHub連携の完了確認、および前セッションから持ち越しの`auth/invalid-api-key`エラー対応状況の確認が**次セッションでの要確認事項**
   - 追記: その後Vercel botのPRコメントから、実際は`saka2931`チームの`legal-life`プロジェクト(`prj_CguEBIQJxbOBViul5pXQCGxxrK6G`)でGitHub連携済み・自動プレビューデプロイも正常動作していることが判明。MCP接続のスコープ不一致で見えていなかっただけで、Vercel↔GitHub連携自体は生きている。Vercel MCPからのプロジェクト直接操作(env設定等)は403 Forbiddenで引き続き不可なため、環境変数追加は今後もユーザーに依頼する必要がある
4. **ユーザーの指示によりFirebase→Supabase全面移行(フェーズ2・3相当)を実施・完了**:
   - `@supabase/supabase-js`を追加、`firebase`パッケージを削除。`lib/firebase/`ディレクトリを削除
   - `lib/supabase/client.ts`(ブラウザ用シングルトンクライアント)、`lib/supabase/types.ts`(生成済み型)を追加
   - `lib/auth/*`(`requireAuth.ts`, `session.ts`, `otp.ts`, `backupCodes.ts`, `notifications.ts`, `format.ts`)をSupabase Auth/Postgres版に全面書き換え。新たに`lib/auth/profile.ts`(`profiles`テーブルのCRUDヘルパー)を追加
   - `app/account/**`配下の全ページ(login, signup, logout, settings, settings/profile, settings/privacy, security, security/2fa, security/2fa/backup-code, security/methods, security/pass, security/activity, security/device, delete)をSupabase Auth APIベースに書き換え
     - Google OAuthは`signInWithPopup`から`signInWithOAuth`(リダイレクト方式)に変更。Google One Tapは`signInWithIdToken`を使用
     - アカウント連携(パスワード設定・Google連携解除等)は`linkIdentity`/`unlinkIdentity`/`updateUser`ベースに変更
   - `components/SessionWatcher.tsx`をFirestore `onSnapshot`からSupabase Realtime(`postgres_changes`、`sessions`テーブル)監視に置き換え
   - `components/AccessLogger.tsx`をRTDB書き込みから`access_logs`テーブルへのinsertに置き換え。クライアント側の90日クリーンアップ処理は削除し、代わりにSupabase側で`pg_cron`による日次パージジョブ(`purge_old_access_logs`)を追加(`supabase/migrations/20260821000004_access_logs_retention_cron.sql`)
   - `components/FirebaseInit.tsx`(Firebase App Check初期化)を削除。`app/layout.tsx`から参照を除去
   - `data/law.ts`(プライバシーポリシー・Cookieポリシー)と`data/faq.ts`のFirebase言及をSupabaseに置き換え。reCAPTCHA Enterprise/Firebase App Check節と、検証できないシンガポールバックアップの記載は削除(該当機能が実在しなくなったため)
   - `README.md`・`docs/vercel-new-project-guide.md`の環境変数表を`NEXT_PUBLIC_FIREBASE_CONFIG`/`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`から`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`に更新
   - `app/info/history/page.tsx`のTIMELINEに「2026年8月: Firebase → Supabaseへ全面移行」の項目を追加
   - `npx tsc --noEmit`・`npm run build`とも成功を確認済み(Supabaseのダミー環境変数で通る)
   - **未実施・要確認事項**:
     - 既存Firebase Authユーザーは1人も存在しない(本番未リリース、テストユーザーなし)前提で移行したため、ユーザー移行処理は書いていない。もし既存ユーザーがいた場合は別途移行スクリプトが必要
     - Supabase側の認証設定(Email確認要否、Google OAuthクライアントID/シークレットの登録、リダイレクトURL許可リスト)はSupabaseダッシュボードでの設定が必要(コードは`data:{full_name}`等を渡す前提で実装済み)
     - 実機での動作確認(ログイン、2FA、Google連携等)は未実施。Vercel環境変数設定後に確認が必要

## Supabase移行の合意済み計画(フェーズ1〜3実施済み、フェーズ4が次)

ユーザー確認済みのフルスコープ移行計画:

### フェーズ1: スキーマ設計とプロジェクト作成
- テーブル: `users`, `sessions`, `security_2fa`, `backup_codes`, `activity_log`, `notification_settings`, `announcements`, `contents`(学習/ニュース), `history`(沿革), `contact_inquiries`
- Row Level Security(RLS)ポリシー設計(Firestoreセキュリティルールの移植)

### フェーズ2: 認証基盤の切り替え(実施済み)
- Firebase Auth → Supabase Auth(email/password, Google OAuth)。`lib/auth/*`配下・`app/account/**`を全面書き換え済み
- 既存Firebase Authユーザーは存在しなかったためユーザー移行処理は未実装(必要になった場合は別途対応)

### フェーズ3: リアルタイム機能の置き換え(実施済み)
- `components/SessionWatcher.tsx`(強制ログアウト監視、Firestore `onSnapshot`)→ Supabase Realtime(`postgres_changes`) 置き換え済み
- `components/AccessLogger.tsx`(RTDB書き込み)→ `access_logs`テーブルへのinsertに置き換え済み。90日パージは`pg_cron`で自動化済み

### フェーズ4: CMS機能の新規構築
- 管理画面(お知らせ・学習・ニュース・沿革のCRUD、お問い合わせ一覧)
- 管理者認証(Supabase Auth上でロール/フラグ管理)
- ヘッダーの告知バナー(`components/Header.tsx`内`Announcements`)をDB駆動化

### フェーズ5: 検証・切り替え
- 全フロー(ログイン/2FA/セッション管理/削除申請等)の実機動作確認(コードは書き換え済みだが未検証)
- Firebase依存コードの削除は完了(`package.json`, `lib/firebase/`, `components/FirebaseInit.tsx`削除済み)。Vercel/Firebaseコンソール側の後片付け(Firebaseプロジェクトの削除等)はユーザー判断

**容量面の懸念は解消済み**: テキストデータ中心である限りSupabase無料枠でも十分。画像は必ずSupabase StorageまたはVercel Blob側に置き、DBにはURLのみ保存する設計にすること。

## 次にやるべきこと

1. **Supabaseダッシュボードでの認証設定**(コード側は実装済みだが、これらはダッシュボードでの設定が別途必要):
   - **正式な本番ドメインは`https://legal-life.vercel.app`(ユーザー確認済み)**。前回2026-08-28に`auth_logs`の`referer`から`legal-life-saka2931.vercel.app`を「本番ドメイン」と誤って断定して記載していたが誤り。訂正する。`legal-life-saka2931.vercel.app`はVercelがプロジェクトに自動付与するチームスラッグ付きの別名ドメインで、Supabase側のSite URL設定が現状こちらを向いているため、確認メールのリンクが`legal-life.vercel.app`ではなくこちらにリダイレクトされてしまっている、というのが実態(ユーザー2026-08-28報告で確認)。**Supabaseダッシュボードの Authentication → URL Configuration → Site URL を `https://legal-life.vercel.app` に修正する必要がある**(これがそもそもの「確認リンクを押しても正常に開かない」という最初の不具合報告の直接原因と考えられる)
   - `legal-life.vercel.app`と`legal-life-saka2931.vercel.app`が同一デプロイのエイリアスなのか別物なのかは、Vercel MCP側の権限不足(該当プロジェクトへのアクセスが404)により未確認。ユーザー側でVercelダッシュボードのDomainsタブを確認してもらう必要あり
   - Authentication → Providers → Google を有効化し、Google Cloud ConsoleのOAuthクライアントID/シークレットを登録。**2026-08-28時点、`query_logs`(source=auth_logs)で直近まで`error_code: provider_disabled`("Provider (issuer \"https://accounts.google.com\") is not enabled")が継続して記録されており、未対応であることを実測で確認済み**
   - Authentication → URL Configuration → Redirect URLsに`https://legal-life.vercel.app/**`(正式な本番ドメイン)を追加。`legal-life-saka2931.vercel.app`宛のURLも当面残しておくと、Site URL切替後の移行期間中に事故が起きにくい
   - Authentication → Emails の確認メール要否設定を確認(現状のサインアップ処理は確認要・不要どちらでも動作するようにしてある)
2. ユーザーに、Vercel環境変数(`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`)の追加が完了したか確認する。Vercel↔GitHub連携自体は既に生きていることを確認済み(Vercel botのPRプレビューデプロイで確認)
3. 実機でのログイン/サインアップ/2FA/デバイス管理/アカウント削除等の動作確認(コードは書き換え済みだが未検証)。特にGoogle OAuthのリダイレクトフロー、One Tap、identity linking/unlinkingは要注意
4. **フェーズ4(CMS機能の新規構築)に着手**: 管理画面(お知らせ・学習・ニュース・沿革のCRUD、お問い合わせ一覧)、管理者認証(`profiles.role='admin'`ベース)、ヘッダー告知バナーのDB駆動化。詳細は「Supabase移行の合意済み計画」フェーズ4参照
5. 前セッションから持ち越しの`auth/invalid-api-key`エラーは、Supabase移行によりFirebase設定自体が不要になったため解消見込み。Vercel環境変数設定後に実際に解消しているか確認する

## 開発時の注意点

- `npm run build`は以下のダミー環境変数で通る:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=x GMAIL_USER=x GMAIL_APP_PASSWORD=x CONTACT_TO_EMAIL=x@x.com GEMINI_API_KEY=x RESEND_API_KEY=x npm run build
  ```
- 変更は小さく区切ってコミット・プッシュし、都度ビルド確認する運用を継続していた
- `old_code`ブランチとの突き合わせは`git archive origin/old_code | tar -x -C /tmp/old_src`のような形で一時展開して比較する
