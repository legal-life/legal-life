"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategory } from "@/data/faq";
import { IconSearch } from "@/components/icons";

export default function FaqApp() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesSearch = (item.question + item.answer).toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-6">
      <h1 className="relative inline-block w-full text-center text-[28px] font-bold text-[#0f172a] pb-4 mt-10 mb-2">
        よくある質問(FAQ)
        <span className="absolute left-1/2 bottom-0 -translate-x-1/2 w-14 h-1 rounded bg-primary" />
      </h1>
      <p className="text-center text-sm text-[#64748b] mb-8">最終更新日: 2026年7月6日</p>

      <p className="max-w-[700px] mx-auto text-center leading-loose text-[#334155] bg-[#f8fafc] rounded-xl p-5 mb-10">
        LEGAL&LIFEに関するよくある質問をまとめました。
        <br />
        ご不明な点がある場合は、お問い合わせページよりお気軽にご連絡ください。
      </p>

      <div className="relative mb-6">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm"
          placeholder="キーワードを入力してください"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-visible md:w-[250px] shrink-0 pb-2 md:pb-0">
          {FAQ_CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`whitespace-nowrap text-left font-bold rounded-lg px-5 py-3 transition-colors ${
                category === c.key ? "bg-[#0f172a] text-white" : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]"
              }`}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10">該当する質問が見つかりませんでした。</p>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((item) => (
                <div key={item.id} className="border border-[#e2e8f0] rounded-lg bg-white overflow-hidden">
                  <button
                    className="relative w-full text-left pl-11 pr-5 py-4 font-bold"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  >
                    <span className="absolute left-[18px] font-black text-primary">Q</span>
                    {item.question}
                  </button>
                  {openId === item.id && (
                    <div className="px-5 pb-4 pl-11 pt-4 border-t border-[#e2e8f0] bg-[#fcfcfc] text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-20 mb-10">
        <div className="w-full max-w-[550px] bg-white border border-[#e0e0e0] rounded-2xl px-6 sm:px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <h2 className="flex items-center justify-center gap-1 text-lg font-bold text-[#333] mb-5">
            <span className="hidden sm:block w-[150px] h-[3px] rounded bg-[#d1d1d1]" />
            解決しませんでしたか?
            <span className="hidden sm:block w-[150px] h-[3px] rounded bg-[#d1d1d1]" />
          </h2>
          <p className="text-sm text-[#666] leading-relaxed mb-6">
            お調べの件が解決しなかった場合は、
            <br />
            担当者が詳しくお答えいたします。
          </p>
          <Link
            href="/info/contact"
            className="inline-block bg-[#333] text-white font-bold rounded-full px-10 py-3.5 transition-all duration-300 hover:bg-[#555] hover:-translate-y-0.5"
          >
            お問い合わせフォームへ
          </Link>
          <p className="text-xs text-[#999] mt-5">※通常、1週間以内に回答させていただきます</p>
        </div>
      </div>
    </div>
  );
}
