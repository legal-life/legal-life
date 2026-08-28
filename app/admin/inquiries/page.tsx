"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getProfile } from "@/lib/auth/profile";

type Inquiry = {
  id: string;
  created_at: string;
  from_name: string;
  gender: string | null;
  age_group: string | null;
  reply_email: string | null;
  inquiry_type: string;
  category: string | null;
  content: string;
  device_info: unknown;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "未対応",
  in_progress: "対応中",
  resolved: "対応済み",
  spam: "スパム",
};

export default function AdminInquiriesPage() {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      const profile = await getProfile(u.id);
      if (profile?.role !== "admin") {
        setChecked(true);
        return;
      }
      setAllowed(true);
      setChecked(true);
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setItems(data);
    })();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("contact_inquiries").update({ status }).eq("id", id);
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, status } : i)) ?? null);
  };

  if (!checked) return null;

  if (!allowed) {
    return (
      <div className="max-w-[520px] mx-auto my-14 bg-white border border-[#dadce0] rounded-2xl p-9 text-center">
        <p className="font-bold text-lg mb-2">アクセス権限がありません</p>
        <p className="text-sm text-gray-500 mb-5">このページは管理者のみ閲覧できます。</p>
        <Link href="/" className="text-primary-dark font-semibold text-sm">ホームへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto my-10 px-4">
      <h1 className="text-xl font-bold mb-1">お問い合わせ管理</h1>
      <p className="text-sm text-gray-500 mb-6">管理者のみ閲覧できるページです</p>

      {error && <p className="text-sm text-[#e74c3c]">読み込みに失敗しました: {error}</p>}
      {!error && items === null && <p className="text-sm text-gray-400">読み込み中...</p>}
      {!error && items?.length === 0 && <p className="text-sm text-gray-400">お問い合わせはありません</p>}

      <div className="space-y-3">
        {items?.map((item) => (
          <div key={item.id} className="bg-white border border-[#dadce0] rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-bold text-sm">
                  {item.from_name} <span className="text-gray-400 font-normal">/ {item.gender || "-"} / {item.age_group || "-"}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.inquiry_type}
                  {item.category ? ` / ${item.category}` : ""} ・ {new Date(item.created_at).toLocaleString("ja-JP")}
                </p>
                {item.reply_email && <p className="text-xs text-gray-500">返信先: {item.reply_email}</p>}
              </div>
              <select
                className="text-xs border border-gray-300 rounded-md px-2 py-1"
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value)}
              >
                {Object.entries(STATUS_LABEL).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <p className="text-sm whitespace-pre-wrap border-t border-[#f1f3f4] pt-3 mt-2">{item.content}</p>
            <button
              className="text-xs text-primary-dark font-semibold mt-3"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              {expandedId === item.id ? "デバイス情報を隠す" : "デバイス情報を表示"}
            </button>
            {expandedId === item.id && (
              <pre className="text-[11px] bg-gray-50 rounded-md p-3 mt-2 overflow-x-auto">
                {JSON.stringify(item.device_info, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
