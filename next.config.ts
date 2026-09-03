import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Googleアカウントのプロフィール画像(next/imageの最適化対象として許可)
    remotePatterns: [{ protocol: "https", hostname: "*.googleusercontent.com" }],
  },
};

export default nextConfig;
