import Link from "next/link";
import CookieBanner from "./CookieBanner";

export default function Footer() {
  return (
    <>
      <footer className="bg-white py-14 px-5 text-center border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="mb-4">
            <Link href="/" className="text-gray-800 font-bold text-base no-underline">
              &copy; LEGAL &amp; LIFE
            </Link>
          </p>
          <ul className="flex flex-wrap justify-center gap-5 list-none p-0 m-0">
            <li><Link href="/law/privacy" className="text-gray-500 text-xs hover:underline">プライバシーポリシー</Link></li>
            <li><Link href="/law/terms" className="text-gray-500 text-xs hover:underline">利用規約</Link></li>
            <li><Link href="/law/disclaimer" className="text-gray-500 text-xs hover:underline">免責事項</Link></li>
            <li><Link href="/law/cookie" className="text-gray-500 text-xs hover:underline">クッキーポリシー</Link></li>
            <li className="text-gray-300">|</li>
            <li><Link href="/info/map" className="text-gray-500 text-xs hover:underline">サイトマップ</Link></li>
            <li><Link href="/info/contact" className="text-gray-500 text-xs hover:underline">お問い合わせ</Link></li>
          </ul>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}
