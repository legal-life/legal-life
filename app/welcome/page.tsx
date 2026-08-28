"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getProfile, type Profile } from "@/lib/auth/profile";
import { IconCheck, IconChat, IconBook, IconSearch, IconNewspaper } from "@/components/icons";

const FEATURES: { href: string; icon: ComponentType<SVGProps<SVGSVGElement>>; title: string; desc: string }[] = [
  { href: "/content/chat", icon: IconChat, title: "チャット", desc: "日本の法令に関する疑問をAIに質問できます" },
  { href: "/content/study/constitution-of-japan", icon: IconBook, title: "法令学習", desc: "憲法をはじめとした各種法令をわかりやすく解説しています" },
  { href: "/content/search", icon: IconSearch, title: "法令検索", desc: "e-Govの情報を使って法令を検索できます" },
  { href: "/content/news", icon: IconNewspaper, title: "ニュース", desc: "最新の法令に関する話題をお届けします" },
];

export default function WelcomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setProfile(await getProfile(u.id));
      setChecked(true);
    })();
  }, []);

  if (!checked) return null;

  return (
    <div className="max-w-[900px] mx-auto px-5 py-14">
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-full bg-[#e8f8ee] flex items-center justify-center mx-auto mb-5">
          <IconCheck className="w-8 h-8 text-[#27ae60]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {profile?.display_name ? `${profile.display_name} 様、` : ""}メールアドレスの確認が完了しました
        </h1>
        <p className="text-sm text-gray-500">legal&life へようこそ。さっそく以下の機能をご利用いただけます。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="flex items-start gap-4 bg-white border border-[#dadce0] rounded-2xl p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
          >
            <span className="w-11 h-11 rounded-full bg-[#f0fbfc] flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-primary-dark" />
            </span>
            <div>
              <p className="font-bold text-sm mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-primary-dark text-white font-bold rounded-full px-10 py-3 text-sm transition"
        >
          サイトを利用する
        </Link>
        <div className="mt-4">
          <Link href="/account/settings" className="text-sm text-primary-dark font-semibold">
            アカウント設定を確認する
          </Link>
        </div>
      </div>
    </div>
  );
}
