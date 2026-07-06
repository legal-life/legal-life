import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ニュース",
  description:
    "このページはlegal&lifeの法令ニュースページです。当ページでは最新の法令ニュースを分かりやすく詳しく読むことが出来ます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

// 元サイトの news.js は空実装で機能未提供のため、見た目のみを移植している(検索・データ取得ロジックは別途対応予定)。
export default function NewsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">最新法令ニュース</h1>
        <p className="text-sm text-gray-500 mt-2">
          最新の法令の改定・制定情報をこのページでは配信しています。
          <br />
          ぜひこのページで分かりやすく詳しく最新の法令情報を学んでみませんか?
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm"
            placeholder="キーワードを入力してください"
            disabled
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <label className="flex items-center gap-2">
            ニュースタイプ:
            <select className="border border-gray-300 rounded px-2 py-1" disabled>
              <option>すべて</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            並び替え:
            <select className="border border-gray-300 rounded px-2 py-1" disabled>
              <option>指定なし</option>
            </select>
          </label>
        </div>

        <button className="bg-primary text-white font-bold rounded-lg px-6 py-2.5 text-sm opacity-60 cursor-not-allowed" disabled>
          検索
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mt-6">この機能は現在準備中です。</p>
    </div>
  );
}
