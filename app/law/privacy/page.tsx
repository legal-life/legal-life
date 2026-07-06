import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { lawDocs } from "@/data/law";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "このページはlegal&lifeのプライバシーポリシーページです。当ページではお客様の個人情報の取り扱いについてご説明します。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyPage() {
  return <LegalDoc doc={lawDocs.privacy} />;
}
