import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学習",
  description:
    "このページはlegal&lifeの学習ページです。当ページでは法令文の条文の意義や解釈をわかりやすく詳しく学習できるコンテンツを制作しています。ぜひご利用ください。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  // 正式公開前の機能のためサイト内ナビゲーションからは意図的にブロックしており、検索エンジンにも公開しない。
  robots: { index: false, follow: true },
};

export default function StudyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">学習コンテンツ選択</h1>
        <p className="text-sm text-gray-500 mt-2">
          このサイトは、法令に関して必要な情報を提供するサイトへ案内するLEGAL&amp;LIFEの学習ページです。
          <br />
          下のセクションから必要な学習コンテンツを選択してください
        </p>
      </div>
      <p className="text-center text-gray-500">現在作成中です。リリースまでお待ちください。</p>
    </div>
  );
}
