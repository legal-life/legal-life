import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { infoDetails } from "@/data/info-details";

export function generateStaticParams() {
  return infoDetails.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const detail = infoDetails.find((d) => d.slug === slug);
  return { title: detail?.title || "お知らせ", robots: { index: false, follow: false } };
}

export default async function InfoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = infoDetails.find((d) => d.slug === slug);
  if (!detail) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1">{detail.title}</h1>
      <p className="text-xs text-gray-400 mb-6" dangerouslySetInnerHTML={{ __html: detail.dateLabel }} />
      <div
        className="prose prose-sm max-w-none text-gray-700 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_section]:bg-gray-50 [&_section]:rounded-lg [&_section]:p-4 [&_section]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:text-gray-500 [&_th]:font-normal [&_th]:pr-4 [&_th]:py-1 [&_th]:align-top [&_td]:py-1 [&_a]:text-primary-dark [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-3 [&_p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
      />
      <Link href="/info" className="inline-block mt-6 text-sm text-primary-dark font-semibold">
        ← お知らせ一覧に戻る
      </Link>
    </div>
  );
}
