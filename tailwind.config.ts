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
      },
      fontFamily: {
        sans: ["var(--font-biz-ud-gothic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
