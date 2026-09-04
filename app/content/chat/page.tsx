import type { Metadata } from "next";
import ChatApp from "./ChatApp";

export const metadata: Metadata = {
  title: "チャット",
  description:
    "このページはlegal&lifeのチャットページです。当ページでは法令や法律問題についてAIにチャットで質問できます。あなたの疑問にリアルタイムで回答します。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  // 正式公開前の機能のためサイト内ナビゲーションからは意図的にブロックしており、検索エンジンにも公開しない。
  robots: { index: false, follow: true },
};

export default function ChatPage() {
  return <ChatApp />;
}
