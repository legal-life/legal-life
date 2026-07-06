import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "コンテンツ",
  description:
    "このページはlegal&lifeのコンテンツページです。当ページでは国民が日本の法令について学べ、法律問題について相談できるオンラインプラットフォームです。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

const CARDS = [
  {
    title: "学習",
    desc: "理解することが難しい法令をわかりやすく学習できます。基礎知識から実務で役立つ応用知識まで、あなたの必要なものからでも着実に理解を深めることができます。",
    href: "/content/study",
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
    href: "/content/news",
    label: "閲覧する",
  },
];

export default function ContentPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">コンテンツページ</h1>
        <p className="text-sm text-gray-500 mt-2">
          このページは、legal&lifeのコンテンツ一覧表示ページです
          <br />
          下のセクションから利用するコンテンツを選択してください
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {CARDS.map((c) => (
          <div key={c.title} className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-2">{c.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {c.desc}
              <br />
              当機能を利用した際は当サイトのサイトポリシーのすべてを同意したものとみなします。
            </p>
            <Link href={c.href} className="inline-block bg-primary text-white text-sm font-bold rounded-lg px-5 py-2">
              {c.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
