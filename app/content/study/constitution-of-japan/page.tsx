import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "日本国憲法",
  description:
    "このページはlegal&lifeの日本国憲法学習ページです。当ページは日本国憲法の条文、意義、解釈をわかりやすく学習することが出来ます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

export default function ConstitutionOfJapanPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold mb-2">コンテンツは現在作成中です</h2>
      <p className="text-gray-500">コンテンツリリースまでしばらくお待ちください</p>
    </div>
  );
}
