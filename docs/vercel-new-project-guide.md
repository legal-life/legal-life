# Vercel 新規プロジェクト作成ガイド(saka2931チーム向け)

`legal-life`リポジトリを、既存の`legal-life-site`チームとは別の`saka2931`チームに新規デプロイする手順です。GitHub連携がまだ確立していないため、以下の順で進めてください。

## 方法A: GitHub連携をきちんと通してから作成する(推奨)

自動デプロイ(git push → 自動反映)が使えるようになるので、こちらを推奨します。

1. https://github.com/apps/vercel を開く
2. 「Configure」(または初回は「Install」)をクリック
3. インストール先の選択画面で、**`legal-life`リポジトリの実際のオーナー**を選ぶ
   - 個人アカウントで組織機能を使っていない場合は、そのGitHubアカウント自身を選択することになります
   - 迷ったら、リポジトリのURL(`https://github.com/<owner>/legal-life`)の`<owner>`部分と一致するアカウントを選んでください
4. リポジトリアクセスで **`legal-life`**(該当リポジトリ)にチェックを入れて保存
   - 「All repositories」を選んでも問題ありません
5. Vercelダッシュボード(https://vercel.com/saka2931 )を開き、「Add New...」→「Project」
6. 「Import Git Repository」一覧に`legal-life`が表示されることを確認してインポート
   - 表示されない場合は、手順3〜4のインストール先/権限が正しいか再確認してください
7. Framework Presetは自動で「Next.js」が検出されます。変更不要です
8. 環境変数を設定(下記「必要な環境変数」を参照)してから「Deploy」

## 方法B: Vercel CLIで直接デプロイし、後からGitHubを連携する

トークンを発行できる場合はこちらが最短です。プロジェクト作成後、いつでも「Project Settings → Git」からGitHub連携を追加できます(既存デプロイ履歴も保持されます)。

1. ローカル(またはこのリポジトリのクローン)で以下を実行:
   ```bash
   npx vercel login
   ```
   ブラウザでVercelアカウント(saka2931チームのメンバー)にログインします。

2. リポジトリのルートで:
   ```bash
   npx vercel link
   ```
   - 「Set up and deploy?」→ Yes
   - Scope(チーム)を **saka2931** に指定
   - プロジェクト名を入力(例: `legal-life`)
   - ルートディレクトリはそのまま(Enter)

3. 環境変数を設定(下記参照)してから本番デプロイ:
   ```bash
   npx vercel --prod
   ```

4. 完了後、Vercelダッシュボードの当該プロジェクト → Settings → Git → 「Connect Git Repository」で`legal-life`リポジトリを接続すると、以降のpushで自動デプロイされるようになります。

## 必要な環境変数

`README.md`に記載の一覧を参照してください。最低限、以下が必須です:

| 変数名 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseのpublishable(anon)キー |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | メール送信(Gmail SMTP) |
| `CONTACT_TO_EMAIL` | お問い合わせ受信先 |
| `GEMINI_API_KEY` | AIチャット機能 |
| `NEXT_PUBLIC_SITE_URL` | デプロイ先の実際のURL(OGP等に使用) |

Vercelダッシュボードの Project Settings → Environment Variables、またはCLIの場合:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
```
のように1つずつ追加できます。

## 注意点

- 新規プロジェクトを作ると、**既存の`legal-life-site`チーム上の本番サイトとは完全に別物**になります(ドメインも別)。動作確認用であることを明確にしてください。
- Supabase Auth・Google OAuthは、新しいデプロイ先ドメインをリダイレクトURL/承認済みドメインとして追加しないと正しく動作しません(Supabaseダッシュボード → Authentication → URL Configuration、およびGoogle Cloud ConsoleのOAuthクライアント設定での追加作業が別途必要です)。
