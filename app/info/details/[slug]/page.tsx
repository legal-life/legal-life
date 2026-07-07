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
    <div className="max-w-[800px] mx-2.5 sm:mx-auto my-8 sm:my-14 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-5 sm:px-10 py-6 sm:py-10">
      <h1 className="text-xl sm:text-2xl text-[#333] border-l-[5px] border-[#7ddce8] pl-4 mb-2.5">{detail.title}</h1>
      <p
        className="block text-sm text-[#888] mb-8 pb-2.5 border-b border-[#eee]"
        dangerouslySetInnerHTML={{ __html: detail.dateLabel }}
      />
      <div
        className="leading-loose text-[#444] text-[1.05rem] [&_p]:mb-6 [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_section]:bg-gray-50 [&_section]:rounded-lg [&_section]:p-4 [&_section]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:text-gray-500 [&_th]:font-normal [&_th]:pr-4 [&_th]:py-1 [&_th]:align-top [&_td]:py-1 [&_a]:text-[#0076a3] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-[#0076a3]"
        dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
      />
      <div className="text-center">
        <Link
          href="/info"
          className="inline-block mt-8 bg-[#f0fbfc] text-[#0076a3] font-bold rounded-full px-8 py-3 border border-[#7ddce8] transition-all duration-300 hover:bg-[#7ddce8] hover:text-white"
        >
          ← お知らせ一覧に戻る
        </Link>
      </div>
    </div>
  );
}
