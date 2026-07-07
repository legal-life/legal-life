import Link from "next/link";
import type { Metadata } from "next";
import { infoDetails } from "@/data/info-details";
import PopupLink from "@/components/PopupLink";

export const metadata: Metadata = {
  title: "ホーム",
  description:
    "このページはlegal&lifeのホームページです。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  openGraph: { title: "ホーム|法令の学習・相談サイト legal&life" },
};

function BoxTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="absolute left-1/2 -top-5 sm:-top-6 -translate-x-1/2 bg-[#7ddce8] text-[#333] font-bold text-lg sm:text-2xl px-8 sm:px-10 py-2 rounded-lg whitespace-nowrap">
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <>
      <div className="text-center px-5 py-8 sm:py-14">
        <h1 className="relative inline-block text-2xl sm:text-3xl font-bold text-[#333] tracking-wide pb-4">
          legal&lifeへようこそ
          <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-14 h-1 rounded bg-[#7ddce8]" />
        </h1>
      </div>

      <div className="bg-[#b2e2e8] px-4 sm:px-5 py-10 sm:py-14 flex flex-col items-center gap-10 sm:gap-16">
        {/* About */}
        <section className="relative w-full max-w-3xl bg-white rounded-[10px] px-4 sm:px-8 pt-9 sm:pt-10 pb-5 text-center">
          <BoxTitle>about</BoxTitle>
          <p className="text-base sm:text-lg text-[#555] mb-5 sm:mb-6">当サイトについて</p>
          <p className="leading-relaxed mb-5">
            当サイトは法令知識の普及と法知識不足による不利益を生まない社会を目指しているサイトです。
          </p>
          <div className="text-right mt-5">
            <Link href="/info/about" className="text-[#0076a3] text-sm no-underline">
              &rarr; 詳細を見る
            </Link>
          </div>
        </section>

        {/* Content */}
        <section className="relative w-full max-w-3xl bg-white rounded-[10px] px-4 sm:px-8 pt-9 sm:pt-10 pb-5 text-center">
          <BoxTitle>content</BoxTitle>
          <p className="text-base sm:text-lg text-[#555] mb-5 sm:mb-6">コンテンツ</p>
          <p className="leading-relaxed mb-5">
            当サイトのコンテンツ一覧です。利用したいコンテンツを選択してください。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <PopupLink className="inline-block min-w-[100px] sm:min-w-[120px] bg-[#b2e2e8] text-[#333] font-bold rounded-[10px] px-5 sm:px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#7ddce8] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1">
              法令学習
            </PopupLink>
            <Link
              href="/content/chat"
              className="inline-block min-w-[100px] sm:min-w-[120px] bg-[#b2e2e8] text-[#333] font-bold rounded-[10px] px-5 sm:px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#7ddce8] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1"
            >
              チャット
            </Link>
            <Link
              href="/content/search"
              className="inline-block min-w-[100px] sm:min-w-[120px] bg-[#b2e2e8] text-[#333] font-bold rounded-[10px] px-5 sm:px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#7ddce8] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1"
            >
              法令検索
            </Link>
            <PopupLink className="inline-block min-w-[100px] sm:min-w-[120px] bg-[#b2e2e8] text-[#333] font-bold rounded-[10px] px-5 sm:px-6 py-3 shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#7ddce8] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1">
              ニュース
            </PopupLink>
          </div>
          <div className="text-right mt-5">
            <Link href="/content" className="text-[#0076a3] text-sm no-underline">
              &rarr; 詳細を見る
            </Link>
          </div>
        </section>

        {/* Information */}
        <section className="relative w-full max-w-3xl bg-white rounded-[10px] px-4 sm:px-8 pt-9 sm:pt-10 pb-5 text-center">
          <BoxTitle>Information</BoxTitle>
          <p className="text-base sm:text-lg text-[#555] mb-5 sm:mb-6">お知らせ</p>
          <div className="text-left max-w-[700px] mx-auto">
            <div className="hidden sm:flex items-center py-3 px-1 border-b-2 border-[#7ddce8] font-bold">
              <span className="w-24 shrink-0">公開・更新日</span>
              <span className="flex-1 pl-2">内容</span>
              <span className="w-24 shrink-0 text-center">リンク</span>
            </div>
            {infoDetails.slice(0, 5).map((d) => (
              <div
                key={d.slug}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-3 sm:py-3 px-1 border-b border-[#7ddce8] text-sm"
              >
                <span className="w-full sm:w-24 shrink-0 text-[#666] sm:text-inherit">{d.date}</span>
                <span className="flex-1 sm:pl-2">{d.title}</span>
                <span className="w-full sm:w-24 shrink-0 text-right sm:text-center">
                  <Link href={`/info/details/${d.slug}`} className="text-[#0076a3]">
                    詳細
                  </Link>
                </span>
              </div>
            ))}
          </div>
          <div className="text-right mt-5">
            <Link href="/info" className="text-[#0076a3] text-sm no-underline">
              &rarr; 詳細を見る
            </Link>
          </div>
        </section>

        {/* Contact */}
        <div className="relative w-full max-w-3xl bg-white rounded-[10px] px-4 sm:px-8 pt-9 sm:pt-10 pb-5 text-center">
          <BoxTitle>contact</BoxTitle>
          <p className="text-base sm:text-lg text-[#555] mb-5 sm:mb-6">お問い合わせ</p>
          <p className="leading-relaxed">
            当サイトに関するご意見・ご質問、または法令に関するご相談などは、
            <br />
            以下のお問い合わせページよりお気軽にご連絡ください。
          </p>
          <div className="my-8">
            <Link
              href="/info/contact"
              className="inline-block w-full sm:w-auto min-w-[150px] bg-[#b2e2e8] text-[#333] font-bold rounded-[10px] px-6 sm:px-12 py-4 shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition-all duration-300 hover:bg-[#7ddce8] hover:shadow-[0_8px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1"
            >
              お問い合わせはこちら
            </Link>
          </div>
          <p className="text-sm text-[#777]">※内容によっては回答にお時間をいただく場合がございます。</p>
        </div>
      </div>
    </>
  );
}
