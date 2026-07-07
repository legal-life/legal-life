import Link from "next/link";
import type { Metadata } from "next";
import PopupLink from "@/components/PopupLink";

export const metadata: Metadata = {
  title: "コンテンツ",
  description:
    "このページはlegal&lifeのコンテンツページです。当ページでは国民が日本の法令について学べ、法律問題について相談できるオンラインプラットフォームです。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

const CARDS = [
  {
    title: "学習",
    desc: "理解することが難しい法令をわかりやすく学習できます。基礎知識から実務で役立つ応用知識まで、あなたの必要なものからでも着実に理解を深めることができます。",
    href: null,
    label: "学習する",
  },
  {
    title: "チャット",
    desc: "弁護士に対して相談するとお金がかかる。そんな問題を解決するために、いつでも、日本国憲法や主要な法令に対して思っていることをAIにチャットして聞くことができます。",
    href: "/content/chat",
    label: "チャットする",
  },
  {
    title: "検索",
    desc: "日本国に今まで作られてきた古い法令文から最新の法令文まで検索して見ることが出来ます。日本国が作成しているe-Gov法令APIを利用してるため正確な情報でもあり信頼できる情報となっているため安心してご利用ください。",
    href: "/content/search",
    label: "検索する",
  },
  {
    title: "ニュース",
    desc: "最新の法令ニュースをわかりやすく詳しく閲覧できます。現存の法令の改定から、新たに制定された法令まで最新の法令をお伝えします。",
    href: null,
    label: "閲覧する",
  },
];

export default function ContentPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold">コンテンツページ</h1>
        <p className="text-sm text-gray-500 mt-2">
          このページは、legal&lifeのコンテンツ一覧表示ページです
          <br />
          下のセクションから利用するコンテンツを選択してください
        </p>
      </div>

      <div className="max-w-[1100px] mx-auto grid sm:grid-cols-2 gap-8">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="flex flex-col text-center bg-white border border-[#f0f0f0] rounded-[20px] p-8 sm:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,200,233,0.2)] hover:border-primary"
          >
            <h3 className="relative inline-block self-center text-2xl text-[#333] mb-5 pb-4">
              {c.title}
              <span className="absolute left-1/2 bottom-0 -translate-x-1/2 w-10 h-1 rounded bg-primary" />
            </h3>
            <p className="text-base text-[#666] leading-relaxed mb-7 flex-grow">
              {c.desc}
              <br />
              当機能を利用した際は当サイトのサイトポリシーのすべてを同意したものとみなします。
            </p>
            {c.href ? (
              <Link
                href={c.href}
                className="block w-[200px] mx-auto rounded-full bg-primary text-white font-bold text-lg px-0 py-4 transition-all duration-300 hover:bg-primary-dark hover:shadow-[0_5px_15px_rgba(0,200,233,0.4)]"
              >
                {c.label}
              </Link>
            ) : (
              <PopupLink className="block w-[200px] mx-auto rounded-full bg-primary text-white font-bold text-lg px-0 py-4 transition-all duration-300 hover:bg-primary-dark hover:shadow-[0_5px_15px_rgba(0,200,233,0.4)]">
                {c.label}
              </PopupLink>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
