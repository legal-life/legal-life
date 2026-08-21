"use client";

import { showMaintenancePopup } from "./MaintenancePopup";

// 遷移せずメンテナンス中ポップアップを表示するリンク(旧 js-popup-show クラス相当)
export default function PopupLink({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href="#"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        showMaintenancePopup();
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
