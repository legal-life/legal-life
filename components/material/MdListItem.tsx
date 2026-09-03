import type { ReactNode } from "react";

// Material Design 3 のList Item相当(surface-container上に乗る行要素)。
export default function MdListItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-m3-md bg-md-surface-container px-4 py-3 ${className}`}>{children}</div>
  );
}
