// サイト全体で絵文字の代わりに使用する共通SVGアイコン集。
// 各アイコンは className で色(currentColor)・サイズを制御する。
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconWarning(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 6l10 7 10-7" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export function IconChat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function IconNewspaper(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 0 1-1V6" />
      <rect x="2" y="4" width="15" height="16" rx="1" />
      <line x1="6" y1="8" x2="13" y2="8" />
      <line x1="6" y1="12" x2="13" y2="12" />
      <line x1="6" y1="16" x2="10" y2="16" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="8" y1="6" x2="9" y2="6" />
      <line x1="12" y1="6" x2="13" y2="6" />
      <line x1="16" y1="6" x2="17" y2="6" />
      <line x1="8" y1="10" x2="9" y2="10" />
      <line x1="12" y1="10" x2="13" y2="10" />
      <line x1="16" y1="10" x2="17" y2="10" />
      <line x1="8" y1="14" x2="9" y2="14" />
      <line x1="12" y1="14" x2="13" y2="14" />
      <line x1="16" y1="14" x2="17" y2="14" />
      <line x1="10" y1="22" x2="10" y2="18" />
      <line x1="14" y1="22" x2="14" y2="18" />
    </svg>
  );
}

export function IconScroll(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h13a2 2 0 0 1 2 2v3H8" />
      <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3" />
      <line x1="8" y1="9" x2="21" y2="9" />
      <line x1="6" y1="13" x2="17" y2="13" />
      <line x1="6" y1="17" x2="17" y2="17" />
    </svg>
  );
}

export function IconQuestion(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconMap(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="18" rx="2" />
      <path d="M9 4h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  );
}

export function IconCookie(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2a9 9 0 1 0 9 9 4 4 0 0 1-5-5 4 4 0 0 1-4-4z" />
      <circle cx="8.5" cy="12.5" r="0.6" fill="currentColor" />
      <circle cx="12.5" cy="16.5" r="0.6" fill="currentColor" />
      <circle cx="15" cy="11" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconBulb(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 2z" />
    </svg>
  );
}

export function IconBug(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <line x1="4" y1="10" x2="8" y2="10" />
      <line x1="16" y1="10" x2="20" y2="10" />
      <line x1="4" y1="17" x2="8" y2="16" />
      <line x1="16" y1="16" x2="20" y2="17" />
      <path d="M9 5l1.5 2" />
      <path d="M15 5l-1.5 2" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}

export function IconNote(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 3h12l4 4v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M16 3v4h4" />
      <line x1="7" y1="12" x2="14" y2="12" />
      <line x1="7" y1="16" x2="14" y2="16" />
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function IconLaptop(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="16" height="10" rx="1" />
      <path d="M2 19h20l-1.5-3h-17z" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconPerson(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function IconFolder(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function IconCross(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconCircleDot(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Google公式ロゴ(多色)。ストロークベースの他アイコンと異なりfillで塗るため、baseを使わない。
export function IconGoogleLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.43-8.71l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
