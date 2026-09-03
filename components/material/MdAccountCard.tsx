import Link from "next/link";
import type { ReactNode } from "react";

// /account/** 配下の各画面で共通する「戻るリンク + タイトル + 本文」の
// Material Design 3 Surfaceカード(elevation 1、shape large)。
type MdAccountCardProps = {
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidthClassName?: string;
};

export default function MdAccountCard({
  backHref,
  backLabel = "戻る",
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-[520px]",
}: MdAccountCardProps) {
  return (
    <div className={`w-full ${maxWidthClassName} rounded-m3-lg bg-md-surface-container-lowest p-9 shadow-m3-1`}>
      {backHref && (
        <Link href={backHref} className="text-m3-label-large text-md-on-surface-variant hover:text-md-primary">
          ← {backLabel}
        </Link>
      )}
      <h1 className={`text-m3-headline-small text-md-on-surface ${backHref ? "mt-3" : ""} mb-1`}>{title}</h1>
      {subtitle && <p className="mb-5 text-m3-body-medium text-md-on-surface-variant">{subtitle}</p>}
      {children}
    </div>
  );
}
