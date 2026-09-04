import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "沿革",
  description:
    "このページはlegal&lifeの沿革ページです。当ページではサイトの開発経緯と成長の歴史をご紹介します。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  // CSS・内容がまだ完全ではないため正式公開前として扱い、サイト内ナビゲーションから
  // 意図的にブロックしており、検索エンジンにも公開しない。
  robots: { index: false, follow: true },
};

const TIMELINE = [
  { date: "2025年4月", title: "サイト企画開始", body: "Wixを用いたサイトデザイン制作を開始しました。法律学習プラットフォームの構想を明確化しました。", tech: "Wix" },
  { date: "2025年9月", title: "AIチャット機能の展開", body: "Google Geminiを活用したAI相談機能の実装を開始。ユーザーが法律に関する質問をAIに相談できるシステムの構築を進めました。", tech: "Wix, GoogleAIStudio, Netlify, Github" },
  { date: "2025年11月", title: "コードによるサイト制作へ軌道変更", body: "より柔軟で拡張性の高いサイトの実装のため、HTML/CSS/JavaScriptによるコード制作への軌道変更", tech: "Github" },
  { date: "2026年2月", title: "サイトプレリリース", body: "Github Pagesを活用してサイトを公開!様々な機能を盛り込んでサイトを公開しました。", tech: "Github, GoogleAIStudio, e-gov法令API, Firebase, GoogleAnalytics, GoogleSearchConsole, GoogleForms" },
  { date: "2026年3月", title: "サイト非公開化", body: "GithubPagesでのサイト公開を終了!様々な課題を改善するために非公開にしました。" },
  { date: "2026年4月", title: "サイト引越し(Cloudflare Pages)", body: "GithubPagesからCloudflare Pagesへ移動!GithubPagesで課題であったサイトアドレスの長さを克服して短くなりました。", tech: "Github, GoogleAIStudio, e-gov法令API, Firebase, GoogleAnalytics, GoogleSearchConsole, GoogleForms, EmailJS" },
  { date: "2026年7月", title: "Next.js + Vercelへ全面リライト", body: "サイト全体をNext.js(TypeScript)+Tailwind CSSへ全面リライトし、ホスティングをCloudflare PagesからVercelへ移行。メール送信基盤(旧legal-life-mailer)もAPI Routesとして統合し、リポジトリを一本化しました。", tech: "Next.js, TypeScript, Tailwind CSS, Vercel, Resend, GoogleAIStudio, e-gov法令API, Firebase" },
  { date: "2026年8月", title: "Firebase → Supabaseへ全面移行", body: "認証・データベース基盤をFirebase(Authentication, Firestore, Realtime Database)からSupabase(PostgreSQL)へ全面移行。Row Level Securityによるアクセス制御を導入し、管理画面(CMS)構築の土台を整備しました。", tech: "Supabase, PostgreSQL, Next.js, TypeScript" },
];

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">サイト沿革</h1>
        <p className="text-sm text-gray-500 mt-2">当サイトの開発・展開の歴史をご紹介します。</p>
      </div>

      <div className="space-y-6 border-l-2 border-primary/30 pl-6">
        {TIMELINE.map((item) => (
          <div key={item.date} className="relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-primary-dark">{item.date}</h3>
            <h4 className="font-bold mb-1">{item.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
            {item.tech && <p className="text-xs text-gray-400 mt-1">利用技術: {item.tech}</p>}
          </div>
        ))}
        <div className="relative">
          <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-gray-300" />
          <h3 className="text-sm font-bold text-gray-500">今後の展開</h3>
          <h4 className="font-bold mb-1">正式リリースと機能拡充</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            現在開発中のサイトを正式にリリース予定です。今後も法令学習コンテンツの充実や新機能の追加を計画しています。
            最新情報については<Link href="/info" className="text-primary-dark underline">お知らせページ</Link>をご確認ください。
          </p>
        </div>
      </div>
    </div>
  );
}
