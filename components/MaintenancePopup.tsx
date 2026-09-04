"use client";

import { useEffect, useState } from "react";

const EVENT_NAME = "ll:maintenance-popup";

export function showMaintenancePopup() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

// 旧important.jsの「開発中ページポップアップ」(js-popup-show)相当。
// 準備中のページへのリンククリック時に、遷移せずこのポップアップを表示する。
export default function MaintenancePopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // 背景クリックでは閉じられるが、キーボードのみの操作やスクリーンリーダー
    // 利用者には同等の手段がない(全画面を覆うモーダルのため、閉じるボタンまで
    // Tabで辿り着く必要がある)。Escapeキーでも閉じられるようにする。
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setVisible(false);
      }}
    >
      <div className="bg-white rounded-xl p-8 max-w-sm w-[90%] text-center shadow-xl">
        <p className="text-sm text-gray-700 leading-relaxed mb-5">
          選択いただいたページは現在メンテナンス中です
          <br />
          メンテナンス終了までしばらくお待ちください
        </p>
        <button
          className="inline-block bg-primary text-white text-sm font-bold rounded-lg px-6 py-2"
          onClick={() => setVisible(false)}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
