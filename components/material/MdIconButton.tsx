import type { ButtonHTMLAttributes } from "react";

// Material Design 3 のIcon Button(状態レイヤー付きの円形タップ領域)。
type MdIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "error";
};

export default function MdIconButton({ tone = "default", className = "", children, ...props }: MdIconButtonProps) {
  const toneClass =
    tone === "error"
      ? "text-md-error hover:bg-md-error/10"
      : "text-md-on-surface-variant hover:bg-md-on-surface/8";
  return (
    <button
      type="button"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
