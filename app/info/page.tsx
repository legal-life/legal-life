import Link from "next/link";
import type { Metadata } from "next";
import { infoDetails } from "@/data/info-details";

export const metadata: Metadata = {
  title: "お知らせ",
  description:
    "このページはlegal&lifeのお知らせページです。当ページでは最新のお知らせ(機能追加、改善、メンテナンス情報など)をお知らせします。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

export default function InfoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">サイトからのお知らせ</h1>
      <div className="bg-white border border-gray-200 rounded-xl divide-y">
        <div className="flex text-xs font-bold text-gray-500 px-4 py-2">
          <span className="w-24 shrink-0">公開・更新日</span>
          <span className="flex-1">内容</span>
        </div>
        {infoDetails.map((d) => (
          <div key={d.slug} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="text-gray-500 w-24 shrink-0">{d.date}</span>
            <span className="flex-1">{d.title}</span>
            <Link href={`/info/details/${d.slug}`} className="text-primary-dark font-semibold shrink-0">
              内容を見る
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
