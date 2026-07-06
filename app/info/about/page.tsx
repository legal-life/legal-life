import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サイト概要",
  description:
    "このページはlegal&lifeのサイト概要ページです。当ページではサイトがどのようなことを目指しているかなどを提示しています。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

function Badge() {
  return (
    <span className="inline-block text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 rounded px-1.5 py-0.5 ml-1">
      開発中の機能
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-3">サイト概要</h1>
        <p className="text-gray-600">当サイトの目的、機能、対象ユーザーなどについてご紹介します。</p>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-2">このサイトについて</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm text-gray-700">
          <p>「LEGAL&LIFE」は、法律に関する疑問や相談ができるプラットフォームです。</p>
          <p>当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。</p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">対象ユーザー</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700">
          <p className="mb-2">当サイトは以下のような方々を対象にしています:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>法律の基礎知識を学びたい学生</li>
            <li>仕事で法律知識が必要なビジネスパーソン</li>
            <li>日常生活で法的問題に直面している方</li>
            <li>法律についてもっと詳しく知りたい一般の方</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">主要な機能</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>法令学習</strong> — 日本国憲法や各種法令について解説しています。<Badge /></li>
            <li><strong>AIチャット</strong> — 法律に関する質問や不安をAIに聞くことが出来ます</li>
            <li><strong>法令検索</strong> — 法令をe-govの機能を使って検索することが出来ます</li>
            <li><strong>ニュース</strong> — 最新の法令に関する話題について詳しく知ることが出来ます<Badge /></li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">使い方</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700">
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>学習</strong> - メニューから「法令学習」を選択します。<Badge /></li>
            <li><strong>AIチャット</strong> - メニューから「AIチャット」を選択します。AIに具体的な相談をすることが出来ます</li>
            <li><strong>検索</strong> — メニューから「法令検索」を選択します。様々な法令をe-govAPI経由で入手することが出来ます。</li>
            <li><strong>ニュース</strong> — メニューから「ニュース」を選択します。最新の法令に関するニュースを詳しく知ることが出来ます<Badge /></li>
          </ol>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">免責事項</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 space-y-2">
          <p>
            本サイトで提供する情報は、参考目的のみで提供されています。法律に関する具体的な相談や問題解決については、弁護士などの専門家にご相談ください。本サイトの情報に基づいて取った行動により生じた損害については、当サイトおよび運営団体は一切の責任を負いません。
          </p>
          <p className="font-semibold">
            詳細は<Link href="/law/disclaimer" className="text-primary-dark underline">こちら</Link>のページをご確認ください。
          </p>
        </div>
      </section>
    </div>
  );
}
