import type { Metadata } from "next";
import ErrorPage from "@/components/ErrorPage";

export const metadata: Metadata = { title: "503", robots: { index: false, follow: false } };

export default function Error503Page() {
  return (
    <ErrorPage
      code="503 Service Unavailable"
      title="現在、サービスを利用できません。"
      desc={
        "申し訳ありませんが、サーバーが一時的に過負荷状態にあるか、メンテナンス中のため、サービスを提供できません。\nお手数をおかけしますが、しばらくしてから再度当サイトへアクセスしてください。"
      }
    />
  );
}
