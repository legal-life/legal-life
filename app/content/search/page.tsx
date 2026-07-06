import type { Metadata } from "next";
import SearchApp from "./SearchApp";

export const metadata: Metadata = {
  title: "検索",
  description:
    "このページはlegal&lifeの法令検索ページです。当ページではe-Gov法令APIを利用して最新の日本の法律・政令・規則をリアルタイムで検索できます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
};

export default function SearchPage() {
  return <SearchApp />;
}
