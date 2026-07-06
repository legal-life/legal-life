import Link from "next/link";
import CookieBanner from "./CookieBanner";

export default function Footer() {
  return (
    <>
      <footer className="site-footer">
        <div className="footer-container">
          <p className="copyright"><Link href="/">&copy; LEGAL &amp; LIFE</Link></p>
          <ul>
            <li><Link href="/law/privacy">プライバシーポリシー</Link></li>
            <li><Link href="/law/terms">利用規約</Link></li>
            <li><Link href="/law/disclaimer">免責事項</Link></li>
            <li><Link href="/law/cookie">クッキーポリシー</Link></li>
            <li>|</li>
            <li><Link href="/info/map">サイトマップ</Link></li>
            <li><Link href="/info/contact">お問い合わせ</Link></li>
          </ul>
        </div>
      </footer>
      <CookieBanner />
    </>
  );
}
