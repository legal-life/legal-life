import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://legal-life.vercel.app";
  // チャット・学習・ニュース・料金プラン・沿革は正式公開前の機能/ページであり
  // サイト内のナビゲーションから意図的にブロックされているため、検索エンジンにも公開しない。
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1.0 },
    { path: "/content", priority: 0.9 },
    { path: "/content/search", priority: 0.9 },
    { path: "/info", priority: 0.5 },
    { path: "/info/about", priority: 0.5 },
    { path: "/info/faq", priority: 0.5 },
    { path: "/info/contact", priority: 0.5 },
  ];
  return pages.map((p) => ({ url: `${base}${p.path}`, priority: p.priority }));
}
