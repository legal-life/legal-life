"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acceptCookies, denyConsent, getCookie, grantConsent, rejectCookies } from "@/lib/consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
    <div id="cookie-banner" className="cookie-banner is-show">
      <div className="cookie-content">
        <p>
          本サイトでは、アクセス解析およびサービス向上のためにCookieを使用しています。
          「同意する」をクリックすることで、Google Analytics等の外部サービスによるデータ処理に同意したものとみなされます。
          詳細は<Link href="/law/privacy#section5" className="cookie-inline-link">外部サービスの利用とデータ提供</Link>
          および<Link href="/law/cookie" className="cookie-inline-link">クッキーポリシー</Link>をご確認ください。
        </p>
        <div className="cookie-buttons">
          <button
            className="cookie-btn cookie-btn-accept"
            onClick={() => {
              acceptCookies();
              setVisible(false);
            }}
          >
            同意する
          </button>
          <button
            className="cookie-btn cookie-btn-reject"
            onClick={() => {
              rejectCookies();
              setVisible(false);
            }}
          >
            拒否する
          </button>
          <Link href="/law/cookie" className="cookie-link">詳細を見る</Link>
        </div>
      </div>
    </div>
  );
}
