import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { lawDocs } from "@/data/law";

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "このページはlegal&lifeの利用規約ページです。当ページではサイトご利用にあたっての規則と条件をご確認できます。当サイトは法令知識の普及と法知識不足による不利益を生まないことを目指しているサイトです。",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return <LegalDoc doc={lawDocs.terms} />;
}
