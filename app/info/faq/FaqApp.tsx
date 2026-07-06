"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FAQ_CATEGORIES, FAQ_ITEMS, type FaqCategory } from "@/data/faq";

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center">よくある質問(FAQ)</h1>
      <p className="text-center text-xs text-gray-400 mt-1 mb-6">最終更新日: 2026年7月6日</p>
      <p className="text-sm text-gray-600 mb-6">
        LEGAL&LIFEに関するよくある質問をまとめました。
        <br />
        ご不明な点がある場合は、お問い合わせページよりお気軽にご連絡ください。
      </p>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2.5 text-sm"
          placeholder="キーワードを入力してください"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FAQ_CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`text-xs font-semibold rounded-full px-3 py-1.5 border ${
              category === c.key ? "bg-primary text-white border-primary" : "border-gray-300 text-gray-600"
            }`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">該当する質問が見つかりませんでした。</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                className="w-full text-left px-4 py-3 font-semibold text-sm flex justify-between items-center"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
              >
                {item.question}
                <span className="text-gray-300 ml-2">{openId === item.id ? "−" : "+"}</span>
              </button>
              {openId === item.id && (
                <div className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center mt-8">
        <h2 className="font-bold mb-2">解決しませんでしたか?</h2>
        <p className="text-sm text-gray-500 mb-4">
          お調べの件が解決しなかった場合は、
          <br />
          担当者が詳しくお答えいたします。
        </p>
        <Link href="/info/contact" className="inline-block bg-primary text-white font-bold rounded-lg px-6 py-2.5 text-sm">
          お問い合わせフォームへ
        </Link>
        <p className="text-xs text-gray-400 mt-3">※通常、1週間以内に回答させていただきます</p>
      </div>
    </div>
  );
}
