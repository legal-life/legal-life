import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

// 元リポジトリの BIZUDGothic-Bold.woff2 は拡張子のみwoff2で実体が壊れたフォントデータのため
// (README記載の「Apple OSでフォントが正常に読み込まれない」不具合の原因と推測される)、ttfのみを使用する。
const bizUDGothic = localFont({
  src: [{ path: "../public/assets/fonts/BIZUDGothic-Bold.ttf", weight: "700", style: "normal" }],
  variable: "--font-biz-ud-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://legal-life.vercel.app"),
  title: { default: "legal&life", template: "%s | legal&life" },
  description: "法令の学習・相談・検索ができる legal&life です。",
  verification: {
    google: "4c8af5b7bb85ef0b",
  },
  openGraph: {
    images: ["/assets/images/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={bizUDGothic.variable}>
      <body className="font-sans">
        <div id="header"><Header /></div>
        <main>{children}</main>
        <div id="footer"><Footer /></div>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
