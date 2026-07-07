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
    <div className="max-w-[900px] mx-auto px-5 py-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#333] mb-2">サイト概要</h1>
        <p className="text-gray-600">当サイトの目的、機能、対象ユーザーなどについてご紹介します。</p>
      </div>

      <section className="text-center mb-14">
        <h2 className="text-2xl font-bold text-[#333] mb-5">このサイトについて</h2>
        <div className="inline-block w-full max-w-[750px] text-left leading-loose bg-[#D6F5FA] rounded p-6 sm:p-7">
          <p>「LEGAL&LIFE」は、法律に関する疑問や相談ができるプラットフォームです。</p>
          <p>当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。</p>
        </div>
      </section>

      <section className="text-center mb-14">
        <h2 className="text-2xl font-bold text-[#333] mb-5">対象ユーザー</h2>
        <div className="inline-block w-full max-w-[750px] text-left leading-loose bg-[#D6F5FA] rounded p-6 sm:p-7">
          <p className="mb-2">当サイトは以下のような方々を対象にしています:</p>
          <ul className="list-none p-0 m-0">
            {[
              "法律の基礎知識を学びたい学生",
              "仕事で法律知識が必要なビジネスパーソン",
              "日常生活で法的問題に直面している方",
              "法律についてもっと詳しく知りたい一般の方",
            ].map((t) => (
              <li key={t} className="relative pl-7 mb-3">
                <span className="absolute left-[5px] font-bold text-[#333]">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="text-center mb-14">
        <h2 className="text-2xl font-bold text-[#333] mb-5">主要な機能</h2>
        <div className="inline-block w-full max-w-[750px] text-left leading-loose bg-[#D6F5FA] rounded p-6 sm:p-7">
          <ul className="list-none p-0 m-0">
            <li className="relative pl-7 mb-3">
              <span className="absolute left-[5px] font-bold text-[#333]">✓</span>
              <strong>法令学習</strong> — 日本国憲法や各種法令について解説しています。<Badge />
            </li>
            <li className="relative pl-7 mb-3">
              <span className="absolute left-[5px] font-bold text-[#333]">✓</span>
              <strong>AIチャット</strong> — 法律に関する質問や不安をAIに聞くことが出来ます
            </li>
            <li className="relative pl-7 mb-3">
              <span className="absolute left-[5px] font-bold text-[#333]">✓</span>
              <strong>法令検索</strong> — 法令をe-govの機能を使って検索することが出来ます
            </li>
            <li className="relative pl-7 mb-3">
              <span className="absolute left-[5px] font-bold text-[#333]">✓</span>
              <strong>ニュース</strong> — 最新の法令に関する話題について詳しく知ることが出来ます<Badge />
            </li>
          </ul>
        </div>
      </section>

      <section className="text-center mb-14">
        <h2 className="text-2xl font-bold text-[#333] mb-5">使い方</h2>
        <div className="inline-block w-full max-w-[750px] text-left leading-loose bg-[#D6F5FA] rounded p-6 sm:p-7">
          <ol className="list-none p-0 m-0">
            {[
              <><strong>学習</strong> - メニューから「法令学習」を選択します。<Badge /></>,
              <><strong>AIチャット</strong> - メニューから「AIチャット」を選択します。AIに具体的な相談をすることが出来ます</>,
              <><strong>検索</strong> — メニューから「法令検索」を選択します。様々な法令をe-govAPI経由で入手することが出来ます。</>,
              <><strong>ニュース</strong> — メニューから「ニュース」を選択します。最新の法令に関するニュースを詳しく知ることが出来ます<Badge /></>,
            ].map((content, i) => (
              <li key={i} className="relative pl-8 mb-4">
                <span className="absolute left-[5px] font-bold">{i + 1}.</span>
                {content}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold text-[#333] mb-5">免責事項</h2>
        <div className="inline-block w-full max-w-[750px] text-left leading-loose bg-[#fff3cd] rounded p-6 sm:p-7">
          <p>
            本サイトで提供する情報は、参考目的のみで提供されています。法律に関する具体的な相談や問題解決については、弁護士などの専門家にご相談ください。本サイトの情報に基づいて取った行動により生じた損害については、当サイトおよび運営団体は一切の責任を負いません。
          </p>
          <p className="font-semibold mt-2">
            詳細は<Link href="/law/disclaimer" className="text-primary-dark underline">こちら</Link>のページをご確認ください。
          </p>
        </div>
      </section>
    </div>
  );
}
