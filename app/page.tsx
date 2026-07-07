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

export default function HomePage() {
  return (
    <>
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold">legal&lifeへようこそ</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8 pb-16">
        <section className="bg-white rounded-xl shadow p-6">
          <p className="text-sm font-bold text-primary-dark uppercase">about</p>
          <p className="text-lg font-bold mb-2">当サイトについて</p>
          <p className="text-gray-700 mb-4">
            当サイトは法令知識の普及と法知識不足による不利益を生まない社会を目指しているサイトです。
          </p>
          <Link href="/info/about" className="text-primary-dark font-semibold">
            &rarr; 詳細を見る
          </Link>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <p className="text-sm font-bold text-primary-dark uppercase">content</p>
          <p className="text-lg font-bold mb-2">コンテンツ</p>
          <p className="text-gray-700 mb-4">当サイトのコンテンツ一覧です。利用したいコンテンツを選択してください。</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <PopupLink className="border rounded-lg text-center py-3 hover:bg-gray-50 block">法令学習</PopupLink>
            <Link href="/content/chat" className="border rounded-lg text-center py-3 hover:bg-gray-50">チャット</Link>
            <Link href="/content/search" className="border rounded-lg text-center py-3 hover:bg-gray-50">法令検索</Link>
            <PopupLink className="border rounded-lg text-center py-3 hover:bg-gray-50 block">ニュース</PopupLink>
          </div>
          <Link href="/content" className="text-primary-dark font-semibold">
            &rarr; 詳細を見る
          </Link>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <p className="text-sm font-bold text-primary-dark uppercase">Information</p>
          <p className="text-lg font-bold mb-4">お知らせ</p>
          <div className="divide-y">
            {infoDetails.slice(0, 5).map((d) => (
              <div key={d.slug} className="flex items-center gap-4 py-2 text-sm">
                <span className="text-gray-500 w-24 shrink-0">{d.date}</span>
                <span className="flex-1">{d.title}</span>
                <Link href={`/info/details/${d.slug}`} className="text-primary-dark shrink-0">詳細</Link>
              </div>
            ))}
          </div>
          <Link href="/info" className="text-primary-dark font-semibold mt-4 inline-block">
            &rarr; 詳細を見る
          </Link>
        </section>

        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-sm font-bold text-primary-dark uppercase">contact</p>
          <p className="text-lg font-bold mb-2">お問い合わせ</p>
          <p className="text-gray-700 mb-4">
            当サイトに関するご意見・ご質問、または法令に関するご相談などは、
            <br />
            以下のお問い合わせページよりお気軽にご連絡ください。
          </p>
          <Link href="/info/contact" className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-lg">
            お問い合わせはこちら
          </Link>
          <p className="text-xs text-gray-500 mt-3">※内容によっては回答にお時間をいただく場合がございます。</p>
        </div>
      </div>
    </>
  );
}
