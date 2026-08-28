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
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-[100vw] box-border bg-slate-800/95 backdrop-blur text-white p-4 sm:p-5 shadow-[0_-2px_15px_rgba(0,0,0,0.3)] z-[2147483647] max-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
        <p className="text-[13px] sm:text-sm leading-relaxed flex-1 m-0">
          本サイトでは、アクセス解析およびサービス向上のためにCookieを使用しています。
          「同意する」をクリックすることで、Google Analytics等の外部サービスによるデータ処理に同意したものとみなされます。
          詳細は<Link href="/law/privacy#section5" className="text-sky-400 underline">外部サービスの利用とデータ提供</Link>
          および<Link href="/law/cookie" className="text-sky-400 underline">クッキーポリシー</Link>をご確認ください。
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 sm:items-center">
          <button
            id="cookie-accept"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-md px-6 py-3"
            onClick={() => {
              acceptCookies();
              setVisible(false);
            }}
          >
            同意する
          </button>
          <button
            id="cookie-reject"
            className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold text-sm rounded-md px-6 py-3"
            onClick={() => {
              rejectCookies();
              setVisible(false);
            }}
          >
            拒否する
          </button>
          <Link href="/law/cookie" className="w-full sm:w-auto text-center border border-white text-white text-sm rounded-md px-6 py-3">
            詳細を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
