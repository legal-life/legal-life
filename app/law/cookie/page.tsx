import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { lawDocs } from "@/data/law";

export const metadata: Metadata = {
  title: "クッキーポリシー",
  robots: { index: false, follow: true },
};

export default function CookiePolicyPage() {
  return <LegalDoc doc={lawDocs.cookie} />;
}
