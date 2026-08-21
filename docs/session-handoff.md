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
- **認証・データ**: Firebase(Authentication, Firestore, Realtime Database, App Check/reCAPTCHA v3)
- **メール送信**: Gmail SMTP経由(Nodemailer)。`GMAIL_USER`/`GMAIL_APP_PASSWORD`。Resend等のESPはgmail.comドメインを送信元として認証できないためこの方式のみ採用
- **配信リスト管理**: Resend Segments API(実送信はしない、リスト管理のみ)
- **AIチャット**: Gemini API(`gemini-3.5-flash`)、サーバー側`/api/chat`経由でキーを秘匿
- **法令検索**: e-Gov法令API Version2を直接クライアントから呼び出し(公開APIのため問題なし)
- **アクセス解析**: 自前実装(`components/AccessLogger.tsx`)、Firebase RTDBの`analytics/{date}/logs`に書き込み。90日で自動クリーンアップ

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

3. **Supabaseへの全面移行の計画を開始**したが、Supabase MCPツールが接続できず未着手:
   - ユーザーの意向: **認証(Firebase Auth)・Firestore・RTDBも含めて完全にSupabase一本化**したい
   - 加えて管理画面(admin)で以下をSupabase駆動にしたいという要望あり:
     - お知らせの新規作成・編集・削除
     - お問い合わせ内容の一覧表示
     - 今後追加予定の学習コンテンツ・ニュースコンテンツの記述
     - 沿革の記述
   - `ListConnectors`で確認したところ、Supabaseコネクタは組織レベルでは`connected: true`だが、このセッションでは`enabledInChat: false`のまま変わらず、`ToolSearch`でSupabase系MCPツール(`mcp__Supabase__*`)を検出できなかった
   - ユーザーは「このチャット内では常に有効」と主張しており、食い違いが解消しなかったため、新しいセッションに切り替えることになった

## Supabase移行の合意済み計画(未着手)

ユーザー確認済みのフルスコープ移行計画:

### フェーズ1: スキーマ設計とプロジェクト作成
- テーブル: `users`, `sessions`, `security_2fa`, `backup_codes`, `activity_log`, `notification_settings`, `announcements`, `contents`(学習/ニュース), `history`(沿革), `contact_inquiries`
- Row Level Security(RLS)ポリシー設計(Firestoreセキュリティルールの移植)

### フェーズ2: 認証基盤の切り替え
- Firebase Auth → Supabase Auth(email/password, Google OAuth)
- 既存Firebase Authユーザーの移行方法の検討(パスワードハッシュは移行不可のため要検討)
- `lib/auth/*`配下の全面書き換え

### フェーズ3: リアルタイム機能の置き換え
- `components/SessionWatcher.tsx`(強制ログアウト監視、Firestore `onSnapshot`)→ Supabase Realtime(`postgres_changes`)
- `components/AccessLogger.tsx`(RTDB書き込み)→ Supabase Postgresへの書き込み

### フェーズ4: CMS機能の新規構築
- 管理画面(お知らせ・学習・ニュース・沿革のCRUD、お問い合わせ一覧)
- 管理者認証(Supabase Auth上でロール/フラグ管理)
- ヘッダーの告知バナー(`components/Header.tsx`内`Announcements`)をDB駆動化

### フェーズ5: 検証・切り替え
- 全フロー(ログイン/2FA/セッション管理/削除申請等)の動作確認
- Firebase依存コードの削除、環境変数整理

**容量面の懸念は解消済み**: テキストデータ中心である限りSupabase無料枠でも十分。画像は必ずSupabase StorageまたはVercel Blob側に置き、DBにはURLのみ保存する設計にすること。

## 次にやるべきこと

1. 新しいセッションでSupabase MCPツール(`mcp__Supabase__*`)が使えるか`ToolSearch`で確認
2. 使えれば、フェーズ1(スキーマ設計・プロジェクト作成)から着手。各フェーズごとにビルド確認・コミットする方針を継続
3. 使えなければ、ユーザーにSupabaseプロジェクトを自身で作成してもらい、Project URLとAPIキーを共有してもらう代替手段に切り替える
4. 並行して、新規Vercelプロジェクト(`legal-life.vercel.app`, `saka2931`チーム)の環境変数設定が完了しているか確認する

## 開発時の注意点

- `npm run build`は以下のダミー環境変数で通る:
  ```
  NEXT_PUBLIC_FIREBASE_CONFIG='{}' GMAIL_USER=x GMAIL_APP_PASSWORD=x CONTACT_TO_EMAIL=x@x.com GEMINI_API_KEY=x RESEND_API_KEY=x npm run build
  ```
- 変更は小さく区切ってコミット・プッシュし、都度ビルド確認する運用を継続していた
- `old_code`ブランチとの突き合わせは`git archive origin/old_code | tar -x -C /tmp/old_src`のような形で一時展開して比較する
