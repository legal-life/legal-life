import Link from "next/link";
import type { Metadata } from "next";
import PopupLink from "@/components/PopupLink";
import {
  IconHome,
  IconChat,
  IconBook,
  IconSearch,
  IconNewspaper,
  IconBuilding,
  IconScroll,
  IconQuestion,
  IconMail,
  IconMap,
  IconLock,
  IconClipboard,
  IconWarning,
  IconCookie,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

export const metadata: Metadata = {
  title: "サイトマップ",
  description:
    "このページはlegal&lifeのサイトマップページです。当ページではサイトの全ページ構成をご確認いただけます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

type SitemapLink = { href: string | null; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const CATEGORIES: { title: string; links: SitemapLink[] }[] = [
  {
    title: "主要ページ",
    links: [
      { href: "/", label: "ホーム", icon: IconHome },
      { href: "/content", label: "コンテンツホーム", icon: IconHome },
      { href: "/content/chat", label: "チャット", icon: IconChat },
      { href: null, label: "法令学習", icon: IconBook },
      { href: "/content/search", label: "法令検索", icon: IconSearch },
      { href: null, label: "ニュース", icon: IconNewspaper },
    ],
  },
  {
    title: "サイト情報ページ",
    links: [
      { href: "/info/about", label: "サイト概要", icon: IconBuilding },
      { href: null, label: "沿革", icon: IconScroll },
      { href: "/info", label: "お知らせ", icon: IconNewspaper },
      { href: "/info/faq", label: "よくある質問", icon: IconQuestion },
      { href: "/info/contact", label: "お問い合わせ", icon: IconMail },
      { href: "/info/map", label: "サイトマップ", icon: IconMap },
    ],
  },
  {
    title: "法的情報ページ",
    links: [
      { href: "/law/privacy", label: "プライバシーポリシー", icon: IconLock },
      { href: "/law/terms", label: "利用規約", icon: IconClipboard },
      { href: "/law/disclaimer", label: "免責事項", icon: IconWarning },
      { href: "/law/cookie", label: "クッキーポリシー", icon: IconCookie },
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
                    className="flex items-center gap-2 text-sm text-[#444] bg-[#fafafa] rounded-md px-3 py-2.5 transition-all duration-200 hover:bg-[#E6F9FC] hover:text-primary-dark hover:-translate-y-0.5"
                  >
                    <l.icon className="w-4 h-4 shrink-0" />
                    {l.label}
                  </Link>
                ) : (
                  <PopupLink
                    key={l.label}
                    className="flex items-center gap-2 text-sm text-[#444] bg-[#fafafa] rounded-md px-3 py-2.5 transition-all duration-200 hover:bg-[#E6F9FC] hover:text-primary-dark hover:-translate-y-0.5"
                  >
                    <l.icon className="w-4 h-4 shrink-0" />
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
