import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00C8E9",
          dark: "#00A6C2",
        },
        // Material Design 3 システムカラーロール(ライトスキーム)。
        // ブランドカラー(#00C8E9, hue≈188.5)を基準にHCT相当のトーナルパレットから算出。
        // /account/** 配下のMaterial Design化専用トークンで、既存のprimary/primary-darkとは独立している。
        md: {
          primary: "#0AA8C2",
          "on-primary": "#FFFFFF",
          "primary-container": "#CFF6FC",
          "on-primary-container": "#032A30",
          secondary: "#567276",
          "on-secondary": "#FFFFFF",
          "secondary-container": "#E1E8EA",
          "on-secondary-container": "#151C1E",
          surface: "#F9FAFA",
          "surface-dim": "#DADCDD",
          "surface-bright": "#F9FAFA",
          "surface-container-lowest": "#FFFFFF",
          "surface-container-low": "#F3F5F5",
          "surface-container": "#EDF0F0",
          "surface-container-high": "#E7EAEA",
          "surface-container-highest": "#E1E4E4",
          "on-surface": "#171B1C",
          "surface-variant": "#E1E8EA",
          "on-surface-variant": "#405559",
          outline: "#6B8E94",
          "outline-variant": "#C1CBCD",
          error: "#BA1A1A",
          "on-error": "#FFFFFF",
          "error-container": "#FFDAD6",
          "on-error-container": "#410002",
        },
      },
      fontFamily: {
        sans: ["var(--font-biz-ud-gothic)", "sans-serif"],
      },
      borderRadius: {
        "m3-xs": "4px",
        "m3-sm": "8px",
        "m3-md": "12px",
        "m3-lg": "16px",
        "m3-xl": "28px",
      },
      boxShadow: {
        // Material Design 3 elevation 1〜5(公式トークンのdp値: 1,3,6,8,12に対応する標準シャドウ)
        "m3-1": "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 1px 3px 1px rgba(0,0,0,0.15)",
        "m3-2": "0px 1px 2px 0px rgba(0,0,0,0.30), 0px 2px 6px 2px rgba(0,0,0,0.15)",
        "m3-3": "0px 1px 3px 0px rgba(0,0,0,0.30), 0px 4px 8px 3px rgba(0,0,0,0.15)",
        "m3-4": "0px 2px 3px 0px rgba(0,0,0,0.30), 0px 6px 10px 4px rgba(0,0,0,0.15)",
        "m3-5": "0px 4px 4px 0px rgba(0,0,0,0.30), 0px 8px 12px 6px rgba(0,0,0,0.15)",
      },
      fontSize: {
        // Material Design 3 タイプスケール(公式トークン値。remベース、rootは既定の16px)
        "m3-display-small": ["2.25rem", { lineHeight: "2.75rem" }],
        "m3-headline-large": ["2rem", { lineHeight: "2.5rem" }],
        "m3-headline-medium": ["1.75rem", { lineHeight: "2.25rem" }],
        "m3-headline-small": ["1.5rem", { lineHeight: "2rem" }],
        "m3-title-large": ["1.375rem", { lineHeight: "1.75rem" }],
        "m3-title-medium": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.009375rem" }],
        "m3-title-small": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem" }],
        "m3-body-large": ["1rem", { lineHeight: "1.5rem", letterSpacing: "0.03125rem" }],
        "m3-body-medium": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.015625rem" }],
        "m3-body-small": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025rem" }],
        "m3-label-large": ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.00625rem" }],
        "m3-label-medium": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.03125rem" }],
        "m3-label-small": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.03125rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
