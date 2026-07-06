import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サイトマップ",
  description:
    "このページはlegal&lifeのサイトマップページです。当ページではサイトの全ページ構成をご確認いただけます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

const CATEGORIES = [
  {
    title: "主要ページ",
    links: [
      { href: "/", label: "🏠 ホーム" },
      { href: "/content", label: "🏠 コンテンツホーム" },
      { href: "/content/chat", label: "💬 チャット" },
      { href: "/content/study", label: "📖 法令学習" },
      { href: "/content/search", label: "🔍 法令検索" },
      { href: "/content/news", label: "📰 ニュース" },
    ],
  },
  {
    title: "サイト情報ページ",
    links: [
      { href: "/info/about", label: "🏢 サイト概要" },
      { href: "/info/history", label: "📜 沿革" },
      { href: "/info", label: "ⓘ お知らせ" },
      { href: "/info/faq", label: "❓ よくある質問" },
      { href: "/info/contact", label: "✉️ お問い合わせ" },
      { href: "/info/map", label: "🗺 サイトマップ" },
    ],
  },
  {
    title: "法的情報ページ",
    links: [
      { href: "/law/privacy", label: "🔒 プライバシーポリシー" },
      { href: "/law/terms", label: "📋 利用規約" },
      { href: "/law/disclaimer", label: "⚠️ 免責事項" },
      { href: "/law/cookie", label: "🍪 クッキーポリシー" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">サイトマップ</h1>
      <div className="grid sm:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h3 className="font-bold text-sm text-gray-500 mb-2">{cat.title}</h3>
            <div className="flex flex-col gap-1">
              {cat.links.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-primary-dark hover:underline">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
