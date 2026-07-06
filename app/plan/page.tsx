import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "このページはlegal&lifeの料金プランページです。当ページでは料金プランの比較などを記載しています。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

const PLANS = [
  {
    name: "ゲスト",
    price: "無料",
    features: ["チャット利用: 不可", "履歴保存: 不可", "学習デモ体験のみ", "ニュース: 6時間後公開"],
    href: "/",
    label: "そのまま利用",
  },
  {
    name: "ベーシック",
    price: "無料",
    priceSub: "(会員登録が必須)",
    features: ["チャット利用: 5回/日", "履歴保存: 最大10件", "学習: 一部利用可能", "ニュース: 6時間後公開"],
    href: "/account/signup",
    label: "ベーシック会員になる",
  },
  {
    name: "プラス",
    price: "¥500 / 月",
    featured: true,
    features: ["チャット利用: 15回/日", "履歴保存: 最大50件", "学習: 月間制限あり", "ニュース: 3時間後公開"],
    href: "#",
    label: "プラス会員になる",
  },
  {
    name: "プロ",
    price: "¥1,000 / 月",
    features: ["チャット利用: 無制限", "履歴保存: 無制限", "学習: すべて無制限", "ニュース: 即時閲覧可能", "新機能先行体験"],
    href: "#",
    label: "プロ会員になる",
  },
];

const COMPARISON_ROWS = [
  { name: "チャット利用回数", values: ["✖", "5回 / 日", "15回 / 日", "◎ 無制限"] },
  { name: "チャット履歴保存", values: ["✖", "最大10件", "最大50件", "◎ 無制限"] },
  { name: "学習コンテンツ", values: ["デモのみ", "一部可能", "○ 制限あり", "◎ 無制限"] },
  { name: "ニュース閲覧", values: ["6時間遅れ", "6時間遅れ", "3時間遅れ", "◎ 即時"] },
  { name: "新機能先行体験", values: ["✖", "✖", "✖", "◎ 利用可能"] },
];

export default function PlanPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">料金プランのご案内</h1>
        <p className="text-sm text-gray-500 mt-2">あなたの学習スタイルに合わせた最適なプランをお選びください</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative bg-white border rounded-xl p-6 text-center ${p.featured ? "border-primary shadow-lg" : "border-gray-200"}`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold rounded-full px-3 py-1">
                おすすめ
              </span>
            )}
            <h2 className="font-bold text-lg mb-3">{p.name}</h2>
            <div className="mb-4">
              <div className="text-2xl font-bold">{p.price}</div>
              {p.priceSub && <div className="text-xs text-gray-400">{p.priceSub}</div>}
            </div>
            <ul className="text-sm text-gray-600 space-y-1.5 mb-5 text-left">
              {p.features.map((f) => (
                <li key={f}>・{f}</li>
              ))}
            </ul>
            <Link
              href={p.href}
              className={`block w-full text-center font-bold rounded-lg py-2.5 text-sm ${
                p.featured ? "bg-primary text-white" : "border border-gray-300 text-gray-700"
              }`}
            >
              {p.label}
            </Link>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-center mb-6">機能比較</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left">機能</th>
              <th className="border border-gray-200 p-3">ゲスト</th>
              <th className="border border-gray-200 p-3">ベーシック</th>
              <th className="border border-gray-200 p-3">プラス</th>
              <th className="border border-gray-200 p-3">プロ</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.name}>
                <td className="border border-gray-200 p-3 font-semibold">{row.name}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="border border-gray-200 p-3 text-center">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
