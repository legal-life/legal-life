"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header>
        <div className="flex items-center">
          <h1>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/assets/images/logo.png" alt="site-logo" width={32} height={32} />
              legal&life
            </Link>
          </h1>
        </div>
        <div className="header-right-content">
          <nav className="header-nav-container">
            <button
              className="hamberger-btn"
              aria-expanded={open}
              aria-controls="main-menu"
              aria-label="メニューを開く"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="hamberger-bar" />
              <span className="hamberger-bar" />
              <span className="hamberger-bar" />
            </button>
            <ul className="header-nav-menu" id="main-menu" data-open={open}>
              <li><Link href="/">ホーム</Link></li>
              <li><Link href="/content/study">法令学習</Link></li>
              <li><Link href="/content/chat">AIチャット</Link></li>
              <li><Link href="/content/search">法令検索</Link></li>
              <li><Link href="/content/news">ニュース</Link></li>
              <li><hr className="menu-divider" /></li>
              <li className="text-xs text-gray-500 py-1">
                アカウントはメンテナンス中です。詳しくは
                <Link href="/info/details/0013" className="text-primary-dark"> こちら</Link>
              </li>
              <li><hr className="menu-divider" /></li>
              <li><Link href="/info/about">サイト概要</Link></li>
              <li><Link href="/info">お知らせ</Link></li>
              <li><Link href="/info/faq">よくある質問</Link></li>
              <li><Link href="/info/contact">お問い合わせ</Link></li>
              <li><Link href="/info/map">サイトマップ</Link></li>
            </ul>
          </nav>
        </div>
      </header>
      <Announcements />
    </>
  );
}

function Announcements() {
  return (
    <div className="announce-wrapper">
      <div className="announce-item announce-type-important">
        <p className="announce-text">
          【重要】現在のサイトステータスと正式リリースについて 更新日: 2026/5/11{" "}
          <Link href="/info/details/9999" className="announce-link">確認する</Link>
        </p>
      </div>
      <div className="announce-item announce-type-maintenance">
        <p className="announce-text">
          【重要】アカウントシステム刷新の全貌と、リリース延期に伴う影響について 更新日: 2026/05/20{" "}
          <Link href="/info/details/0013" className="announce-link">確認する</Link>
        </p>
      </div>
    </div>
  );
}
