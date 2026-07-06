import type { Metadata } from "next";
import ErrorPage from "@/components/ErrorPage";

export const metadata: Metadata = { title: "401", robots: { index: false, follow: false } };

export default function Error401Page() {
  return (
    <ErrorPage
      code="401 Unauthorized"
      title="認証が必要なページです"
      desc={
        "申し訳ありませんが、このページにアクセスするには有効な認証情報が必要です。\nお手数をおかけしますが、再度アカウントにログインしてから該当ページへアクセスしてください。"
      }
    />
  );
}
