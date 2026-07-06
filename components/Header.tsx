"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between bg-gradient-to-r from-primary to-primary px-6 shadow-md relative">
        <h1>
          <Link href="/" className="flex items-center gap-3 py-3 text-white font-bold text-xl">
            <Image src="/assets/images/logo.png" alt="site-logo" width={44} height={44} className="rounded-md" />
            legal&life
          </Link>
        </h1>
        <nav className="flex items-center">
          <button
            className="relative z-[1001] ml-2.5 flex flex-col gap-1.5 p-0"
            aria-expanded={open}
            aria-controls="main-menu"
            aria-label="メニューを開く"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="block w-6 h-0.5 bg-black transition-all" />
            <span className="block w-6 h-0.5 bg-black transition-all" />
            <span className="block w-6 h-0.5 bg-black transition-all" />
          </button>
          <ul
            id="main-menu"
            className={`absolute top-0 right-0 w-[220px] max-h-screen p-8 bg-[#d6eaef] z-[1000] list-none transition-transform duration-300 ${
              open ? "translate-x-0 visible" : "translate-x-full invisible"
            }`}
          >
            <li className="mb-5"><Link href="/" className="text-gray-800 hover:text-primary-dark">ホーム</Link></li>
            <li className="mb-5"><Link href="/content/study" className="text-gray-800 hover:text-primary-dark">法令学習</Link></li>
            <li className="mb-5"><Link href="/content/chat" className="text-gray-800 hover:text-primary-dark">AIチャット</Link></li>
            <li className="mb-5"><Link href="/content/search" className="text-gray-800 hover:text-primary-dark">法令検索</Link></li>
            <li className="mb-5"><Link href="/content/news" className="text-gray-800 hover:text-primary-dark">ニュース</Link></li>
            <li className="mb-5"><hr className="border-t-2 border-black/15" /></li>
            <li className="mb-5 text-xs text-gray-500">
              アカウントはメンテナンス中です。詳しくは
              <Link href="/info/details/0013" className="text-primary-dark"> こちら</Link>
            </li>
            <li className="mb-5"><hr className="border-t-2 border-black/15" /></li>
            <li className="mb-5"><Link href="/info/about" className="text-gray-800 hover:text-primary-dark">サイト概要</Link></li>
            <li className="mb-5"><Link href="/info" className="text-gray-800 hover:text-primary-dark">お知らせ</Link></li>
            <li className="mb-5"><Link href="/info/faq" className="text-gray-800 hover:text-primary-dark">よくある質問</Link></li>
            <li className="mb-5"><Link href="/info/contact" className="text-gray-800 hover:text-primary-dark">お問い合わせ</Link></li>
            <li className="mb-5"><Link href="/info/map" className="text-gray-800 hover:text-primary-dark">サイトマップ</Link></li>
          </ul>
        </nav>
      </header>
      <Announcements />
    </>
  );
}

function Announcements() {
  return (
    <div className="w-full">
      <div className="max-w-[1000px] mx-auto flex items-center gap-3 px-5 py-2.5 bg-red-50">
        <p className="text-sm text-gray-800 m-0">
          【重要】現在のサイトステータスと正式リリースについて 更新日: 2026/5/11{" "}
          <Link href="/info/details/9999" className="text-sky-700 font-bold underline ml-2">確認する</Link>
        </p>
      </div>
      <div className="max-w-[1000px] mx-auto flex items-center gap-3 px-5 py-2.5 bg-amber-50 border-t border-dashed border-red-200">
        <p className="text-sm text-gray-800 m-0">
          【重要】アカウントシステム刷新の全貌と、リリース延期に伴う影響について 更新日: 2026/05/20{" "}
          <Link href="/info/details/0013" className="text-sky-700 font-bold underline ml-2">確認する</Link>
        </p>
      </div>
    </div>
  );
}
