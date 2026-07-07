"use client";

import { useEffect, useState } from "react";

// 旧important.jsの「TOPに戻るボタン」相当
export default function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="トップへ戻る"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed z-[9999] right-[10px] sm:right-5 bottom-5 w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] rounded-full bg-primary text-white shadow-lg flex items-center justify-center text-lg transition-all duration-300 ${
        show ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-5"
      }`}
    >
      ▲
    </button>
  );
}
