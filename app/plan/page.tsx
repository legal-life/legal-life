import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconCross, IconCheck } from "@/components/icons";

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

const CROSS = <IconCross className="inline w-3.5 h-3.5 text-gray-400" />;
const CHECK = <IconCheck className="inline w-3.5 h-3.5 text-primary-dark mr-1" />;

const COMPARISON_ROWS: { name: string; values: ReactNode[] }[] = [
  { name: "チャット利用回数", values: [CROSS, "5回 / 日", "15回 / 日", <>{CHECK}無制限</>] },
  { name: "チャット履歴保存", values: [CROSS, "最大10件", "最大50件", <>{CHECK}無制限</>] },
  { name: "学習コンテンツ", values: ["デモのみ", "一部可能", <>{CHECK}制限あり</>, <>{CHECK}無制限</>] },
  { name: "ニュース閲覧", values: ["6時間遅れ", "6時間遅れ", "3時間遅れ", <>{CHECK}即時</>] },
  { name: "新機能先行体験", values: [CROSS, CROSS, CROSS, <>{CHECK}利用可能</>] },
];

export default function PlanPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">料金プランのご案内</h1>
        <p className="text-sm text-gray-500 mt-2">あなたの学習スタイルに合わせた最適なプランをお選びください</p>
      </div>

      <div className="flex gap-5 mb-12 overflow-x-auto pb-2 lg:justify-center lg:overflow-visible">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col items-center shrink-0 w-[220px] sm:w-[240px] bg-white border rounded-lg px-6 pt-10 pb-6 text-center transition-transform ${
              p.featured ? "border-2 border-[#3498db] scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.1)] z-10" : "border-[#e0e0e0]"
            }`}
          >
            {p.featured && (
              <span className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-[#3498db] text-white text-xs font-bold rounded-full px-4 py-1 whitespace-nowrap shadow-[0_2px_5px_rgba(0,0,0,0.2)]">
                おすすめ
              </span>
            )}
            <h2 className="font-bold text-lg text-[#2c3e50] mb-3">{p.name}</h2>
            <div className="flex flex-col items-center justify-center h-[100px] mb-2">
              <div className="text-2xl font-bold">{p.price}</div>
              {p.priceSub && <div className="text-xs text-gray-400 mt-1">{p.priceSub}</div>}
            </div>
            <ul className="w-full text-sm text-gray-600 text-left mb-6 flex-grow">
              {p.features.map((f) => (
                <li key={f} className="py-2.5 border-b border-dotted border-[#e0e0e0]">
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={p.href}
              className={`block w-4/5 text-center font-bold rounded px-5 py-2.5 text-sm text-white ${
                p.featured ? "bg-[#3498db]" : "bg-[#2c3e50]"
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
