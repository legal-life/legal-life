import type { Metadata } from "next";
import LegalDoc from "@/components/LegalDoc";
import { lawDocs } from "@/data/law";

export const metadata: Metadata = {
  title: "免責事項",
  robots: { index: false, follow: true },
};

export default function DisclaimerPage() {
  return <LegalDoc doc={lawDocs.disclaimer} />;
}
