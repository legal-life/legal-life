# legal&lifeの README

## 私たちについて
私たちは、学校の授業の一環でコードによるサイト作成をしているものです。  
まだ未熟なコーディネータなので、暫定コードが入っているかと思われます。  
その点を皆様にご指摘していただきたいと考えております。ご協力をよろしくお願いいたします。

## 私たちが作成しているサイトについて
lrgal&lifeというサイトを作成しています。  
このサイトには法令の学習機能・相談機能・検索機能を導入したいと思います。  
このサイトによって法令に関して困る人を無くすことを目指しております。
詳細は<a href="https://legal-life.pages.dev/info/about" target="_blank" rel="noopener, noreferrer">サイト概要ページ</a>にも掲載しております。

## サイトのデモ利用について
動作確認をする際は、<a href="https://legal-life.pages.dev/" target="_blank" rel="noopener, noreferrer">こちら</a>のページで動作確認が可能になっております。

## それぞれの機能について
- 学習機能
>[!NOTE]
>法令をわかりやすく学習できるページを作成します。

>[!CAUTION]
>とにかくすべての法令を追加したいがコンテンツ作成に様々な課題がある。  
>リリースが実現できない可能性

- <a href="https://legal-life.pages.dev/content/caht" target="_blank" rel="noopener, noreferrer">チャット機能</a>
> [!NOTE]
>今現在はGemini-3.5-flashを利用して法令のチャットができるようにしております。

> [!CAUTION]
>サイト利用者が増加し大量のリクエストが発生した際には課金しないといけない。

- <a href="https://legal-life.pages.dev/content/search" target="_blank" rel="noopener, noreferrer">検索機能</a>
> [!NOTE]
> e-gov法令APIを利用して法令を検索できるようにしています。

> [!CAUTION]
>大量にリクエストが発生しても大丈夫なのか。

- <a href="https://legal-life.pages.dev/content/news" target="_blank" rel="noopener, noreferrer">ニュース機能</a>
> [!NOTE]
>法令関連のニュースを掲載します。  
>ニュースの下部には該当する学習機能のページへの推移を促進

> [!CAUTION]
> ニュースを個人的に読み解くのが非常に難しい

その他お知らせは、<a href="https://legal-life.pages.dev/info" target="_blank" rel="noopener, noreferrer">お知らせページ</a>をご確認ください。

## 既知の問題
- Webアクセシビリティ  
ハンガーメニュー表示時並びに、アカウントログイン画面表示時に後ろ側もTabキーが反応してしまう問題  
それ以外のページにおいてもボタンに2回もTabキーが反応してしまう問題
>改善するために、様々なページにて検証を重ねております。

## 技術スタック(Next.jsへの全面リライト後)
本サイトはCloudflare Pages上の静的HTML/CSS/vanilla-JSサイトから、Next.js(App Router)+ TypeScript + Tailwind CSSへ全面リライトし、Vercelへ移行しました。

- **フレームワーク**: Next.js 15 (App Router) + TypeScript
- **スタイル**: Tailwind CSS(`next/font/local`でBIZUDGothicフォントを自己ホスト化。旧woff2ファイルは実体が壊れたフォントデータだったため削除・修正済み)
- **認証**: Supabase Auth(Google / メール・パスワード、2FA、セッション管理)
- **データベース**: Supabase(PostgreSQL)
- **メール送信**: Gmail SMTP(Nodemailer)。旧legal-life-mailerリポジトリのCloudflare Workers実装を`/api/mail`としてこのリポジトリに統合(legal-life-mailerリポジトリはアーカイブ予定)。第三者ESP(Resend/Brevo等)はgmail.com等の共有ドメインを送信元として認証できないため、独自ドメインなしでGmailアドレスから送るにはこの方式を採用
- **通知配信リスト管理**: Resend Segments(実際のメール送信は行わず、`/api/mail/audience`でお知らせ配信対象リストの管理のみに使用。ドメイン未認証でも利用可能)
- **AIチャット**: Gemini API(APIキーはサーバー側`/api/chat`経由のみで使用し、クライアントに露出しない構成)
- **法令検索**: e-Gov法令API
- **ホスティング**: Vercel

### 必要な環境変数
| 変数名 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのpublishable(anon)キー |
| `NEXT_PUBLIC_SITE_URL` | サイトの本番URL(メタデータ・サイトマップ生成に使用) |
| `GEMINI_API_KEY` | Gemini API(サーバー専用、`/api/chat`のみで参照) |
| `GMAIL_USER` | メール送信元のGmailアドレス(例: `xxxx@gmail.com`) |
| `GMAIL_APP_PASSWORD` | Googleアカウントの2段階認証を有効にした上で発行する「アプリパスワード」 |
| `CONTACT_TO_EMAIL` | お問い合わせフォームの送信先メールアドレス |
| `RESEND_API_KEY` | Resend Segments(配信リスト管理専用。メール送信自体には使用しない)のAPIキー |
| `SEGMENT_MAINTENANCE` / `SEGMENT_FEATURE` / `SEGMENT_NEWSLETTER` | Resend Segment ID(`seg_`から始まる。通知設定連携用) |
