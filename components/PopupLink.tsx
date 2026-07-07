"use client";

import { showMaintenancePopup } from "./MaintenancePopup";

// 遷移せずメンテナンス中ポップアップを表示するリンク(旧 js-popup-show クラス相当)
export default function PopupLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        showMaintenancePopup();
      }}
    >
      {children}
    </a>
  );
}
