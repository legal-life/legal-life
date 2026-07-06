import type { Metadata } from "next";
import FaqApp from "./FaqApp";

export const metadata: Metadata = {
  title: "よくある質問",
  description:
    "このページはlegal&lifeのよくある質問ページです。当ページではサイトについて寄せられることが多い質問と回答をまとめて提示しています。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

export default function FaqPage() {
  return <FaqApp />;
}
