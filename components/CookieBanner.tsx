"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acceptCookies, denyConsent, getCookie, grantConsent, initConsentDefaults, rejectCookies } from "@/lib/consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // window.gtag はここで初期化しないと未定義のままgrantConsent/denyConsentが
    // 呼ばれてクラッシュする(cookie_consentが既に保存されているリピーター訪問時に必ず発生)。
    initConsentDefaults();
    const consent = getCookie("cookie_consent");
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    } else if (consent === "accepted") {
      grantConsent();
    } else {
      denyConsent();
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur text-white p-5 shadow-[0_-2px_15px_rgba(0,0,0,0.3)] z-[9999] max-h-screen">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-5">
        <p className="text-sm leading-relaxed flex-1 m-0">
          本サイトでは、アクセス解析およびサービス向上のためにCookieを使用しています。
          「同意する」をクリックすることで、Google Analytics等の外部サービスによるデータ処理に同意したものとみなされます。
          詳細は<Link href="/law/privacy#section5" className="text-sky-400 underline">外部サービスの利用とデータ提供</Link>
          および<Link href="/law/cookie" className="text-sky-400 underline">クッキーポリシー</Link>をご確認ください。
        </p>
        <div className="flex gap-2.5 flex-wrap items-center">
          <button
            id="cookie-accept"
            className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-md px-6 py-3"
            onClick={() => {
              acceptCookies();
              setVisible(false);
            }}
          >
            同意する
          </button>
          <button
            id="cookie-reject"
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold text-sm rounded-md px-6 py-3"
            onClick={() => {
              rejectCookies();
              setVisible(false);
            }}
          >
            拒否する
          </button>
          <Link href="/law/cookie" className="border border-white text-white text-sm rounded-md px-6 py-3">
            詳細を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
