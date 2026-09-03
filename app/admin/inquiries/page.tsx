import type { Metadata } from "next";
import InquiriesClient from "./InquiriesClient";

// 管理者専用ページのため検索エンジンには公開しない。
export const metadata: Metadata = {
  title: "お問い合わせ管理",
  robots: { index: false, follow: false },
};

export default function AdminInquiriesPage() {
  return <InquiriesClient />;
}
