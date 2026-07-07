import Link from "next/link";
import type { Metadata } from "next";
import PopupLink from "@/components/PopupLink";

export const metadata: Metadata = {
  title: "サイトマップ",
  description:
    "このページはlegal&lifeのサイトマップページです。当ページではサイトの全ページ構成をご確認いただけます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

const CATEGORIES: { title: string; links: { href: string | null; label: string }[] }[] = [
  {
    title: "主要ページ",
    links: [
      { href: "/", label: "🏠 ホーム" },
      { href: "/content", label: "🏠 コンテンツホーム" },
      { href: "/content/chat", label: "💬 チャット" },
      { href: null, label: "📖 法令学習" },
      { href: "/content/search", label: "🔍 法令検索" },
      { href: null, label: "📰 ニュース" },
    ],
  },
  {
    title: "サイト情報ページ",
    links: [
      { href: "/info/about", label: "🏢 サイト概要" },
      { href: null, label: "📜 沿革" },
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
    <div className="px-5 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">サイトマップ</h1>
      <div className="max-w-[1100px] mx-auto grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            className="h-full box-border bg-white rounded-xl p-5 shadow-[0_4px_10px_rgba(0,0,0,0.05)] border-t-4 border-primary"
          >
            <h3 className="text-lg text-[#333] mb-4 pb-2 border-b-2 border-[#f0faff]">{cat.title}</h3>
            <div className="flex flex-col gap-1.5">
              {cat.links.map((l) =>
                l.href ? (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-sm text-[#444] bg-[#fafafa] rounded-md px-3 py-2.5 transition-all duration-200 hover:bg-[#E6F9FC] hover:text-primary-dark hover:-translate-y-0.5"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <PopupLink
                    key={l.label}
                    className="block text-sm text-[#444] bg-[#fafafa] rounded-md px-3 py-2.5 transition-all duration-200 hover:bg-[#E6F9FC] hover:text-primary-dark hover:-translate-y-0.5"
                  >
                    {l.label}
                  </PopupLink>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
