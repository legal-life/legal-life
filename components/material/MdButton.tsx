import type { ButtonHTMLAttributes } from "react";

// Material Design 3 ボタン(filled / tonal / outlined / text)。
// /account/** 配下専用。M3仕様のボタンは既定でfully-rounded(pill)形状。
type Variant = "filled" | "tonal" | "outlined" | "text";

const VARIANT_CLASS: Record<Variant, string> = {
  filled: "bg-md-primary text-md-on-primary hover:shadow-m3-1 active:shadow-none disabled:bg-md-on-surface/10 disabled:text-md-on-surface/40",
  tonal:
    "bg-md-secondary-container text-md-on-secondary-container hover:shadow-m3-1 active:shadow-none disabled:bg-md-on-surface/10 disabled:text-md-on-surface/40",
  outlined:
    "bg-transparent text-md-primary border border-md-outline hover:bg-md-primary/8 disabled:text-md-on-surface/40 disabled:border-md-on-surface/12",
  text: "bg-transparent text-md-primary hover:bg-md-primary/8 disabled:text-md-on-surface/40",
};

type MdButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function MdButton({ variant = "filled", className = "", children, ...props }: MdButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 h-10 text-m3-label-large font-medium transition-shadow disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
