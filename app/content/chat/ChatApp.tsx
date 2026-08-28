"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const STORAGE_KEY = "legalChatHistory";
const MAX_INPUT_LEN = 1000;

type ChatItem = { id: string; question: string; answer: string; category?: string | null };

export default function ChatApp() {
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ログイン中はSupabase(chat_history)に読み書きし、未ログイン時はブラウザのlocalStorageに保存する。
  // 未ログインで貯まった履歴は、ログインした瞬間にSupabaseへ移行してlocalStorageから消す。
  useEffect(() => {
    const loadFromLocal = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      setHistory(saved ? JSON.parse(saved) : []);
    };

    const loadFromSupabase = async (uid: string) => {
      const { data } = await supabase
        .from("chat_history")
        .select("id, question, answer, category")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });
      setHistory(data ?? []);
    };

    const migrateLocalToSupabase = async (uid: string) => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const local: ChatItem[] = JSON.parse(raw);
      if (local.length > 0) {
        await supabase.from("chat_history").insert(
          local.map((item) => ({
            user_id: uid,
            question: item.question,
            answer: item.answer,
            category: item.category ?? null,
          })),
        );
      }
      localStorage.removeItem(STORAGE_KEY);
    };

    const initForUser = async (uid: string | null) => {
      setUserId(uid);
      if (uid) {
        await migrateLocalToSupabase(uid);
        await loadFromSupabase(uid);
      } else {
        loadFromLocal();
      }
    };

    let subscription: { unsubscribe: () => void } | undefined;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await initForUser(user?.id ?? null);
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        initForUser(session?.user?.id ?? null);
      });
      subscription = sub;
    })();

    return () => subscription?.unsubscribe();
  }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || sending) return;
    if (question.length > MAX_INPUT_LEN) {
      alert(`質問は${MAX_INPUT_LEN}文字以内で入力してください。`);
      return;
    }
    setSending(true);
    setError("");
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "エラーが発生しました");
      if (data.ignored) {
        setError("法令に関する質問ではないため、回答・保存をスキップしました。");
        return;
      }

      if (userId) {
        const { data: inserted, error: insertError } = await supabase
          .from("chat_history")
          .insert({ user_id: userId, question, answer: data.answer, category: data.category ?? null })
          .select("id, question, answer, category")
          .single();
        if (!insertError && inserted) setHistory((h) => [...h, inserted]);
      } else {
        const item: ChatItem = { id: Date.now().toString(), question, answer: data.answer, category: data.category ?? null };
        const next = [...history, item];
        setHistory(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }

      setTimeout(() => {
        areaRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const [confirmTarget, setConfirmTarget] = useState<{ type: "one"; id: string } | { type: "all" } | null>(null);

  const deleteItem = (id: string) => setConfirmTarget({ type: "one", id });
  const clearAll = () => {
    if (history.length === 0) return;
    setConfirmTarget({ type: "all" });
  };
  const runConfirm = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.type === "one") {
      if (userId) await supabase.from("chat_history").delete().eq("id", confirmTarget.id).eq("user_id", userId);
      const next = history.filter((i) => i.id !== confirmTarget.id);
      setHistory(next);
      if (!userId) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      if (userId) await supabase.from("chat_history").delete().eq("user_id", userId);
      setHistory([]);
      if (!userId) localStorage.removeItem(STORAGE_KEY);
    }
    setConfirmTarget(null);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legal-life-chat-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-5 pb-12">
      <div className="text-center py-6 mb-2">
        <h1 className="text-2xl font-bold">法令専門AIチャット</h1>
        <p className="text-sm text-gray-500 mt-2">
          日本の法令に関して聞かれたことに対してAIが詳しく回答します。
          <br />
          履歴はご利用中の端末もしくはサーバーに自動で保存されます。
        </p>
      </div>

      <div className="bg-[#fff9db] border border-[#ffe066] border-l-[6px] border-l-[#fcc419] rounded-xl px-6 py-4 mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <p className="font-bold text-[#856404] text-lg mb-2">⚠️ 重要な注意事項</p>
        <ul className="text-sm text-[#856404] leading-relaxed list-disc pl-5 mb-2">
          <li>個人情報(氏名、住所、電話番号等)は絶対に入力しないでください</li>
          <li>本サービスは法的助言ではありません</li>
          <li>AI生成の回答には誤りが含まれる可能性があります</li>
          <li>重要な判断には必ず専門家にご相談ください</li>
        </ul>
        <p className="text-sm text-[#856404] pt-2.5 border-t border-dashed border-[#85640433]">
          当機能利用時は当サイト{" "}
          <Link href="/law/disclaimer" className="underline font-bold">免責事項</Link>{" "}
          並びに{" "}
          <Link href="/law/privacy#section6" className="underline font-bold">AI利用に関する詳細情報開示</Link>{" "}
          に同意したものをみなします。
        </p>
      </div>

      <div className="bg-[#f0faff] border border-[#e0f2f7] rounded-xl px-6 py-3 mb-5 text-center text-sm text-[#444]">
        💡 わからない法令名は{" "}
        <Link href="/content/search" className="text-[#008fa6] font-bold border-b-[1.5px] border-primary hover:text-primary">
          法令検索
        </Link>{" "}
        ページで調べてみよう!
      </div>

      <div className="flex flex-col h-[85vh] max-h-[900px] bg-white rounded-2xl border border-[#e2e8f0]/80 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <span className="font-bold text-[#0f172a]">
            法令専門AIチャット
            <span className="ml-2 text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 rounded px-1.5 py-0.5 align-middle">
              テスト中の機能
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 border border-[#cbd5e1] text-[#334155] text-sm font-bold rounded-xl transition-all hover:bg-[#f1f5f9] disabled:opacity-40"
              disabled={history.length === 0}
              onClick={exportHistory}
            >
              エクスポート
            </button>
            <button
              id="clearAllButton"
              className="px-6 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.02]"
              onClick={clearAll}
            >
              全削除
            </button>
          </div>
        </div>

        <div ref={areaRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 bg-[#fcfcfd]">
          {history.length === 0 && (
            <AiBubble text="こんにちは!日本の法令に関する一般的な仕組みや制度について、AIがお答えします。何かお困りですか?" />
          )}
          {history.map((item) => (
            <div key={item.id}>
              <div className="flex items-center gap-3 justify-end mb-3 group">
                <button
                  className="chat-delete-btn order-first text-[#cbd5e1] hover:text-[#ef4444] hover:scale-110 transition-all"
                  onClick={() => deleteItem(item.id)}
                >
                  🗑️
                </button>
                <div className="bg-[#0f172a] text-white rounded-[18px] rounded-br-[4px] px-5 py-3.5 max-w-[80%] text-sm whitespace-pre-wrap">
                  {item.question}
                </div>
              </div>
              <AiBubble text={item.answer} />
            </div>
          ))}
          {sending && <span className="text-[#64748b] font-bold animate-pulse">考え中...</span>}
          {error && <p className="text-sm text-red-600">⚠️ {error}</p>}
        </div>

        <div className="flex gap-4 items-end px-6 py-5 border-t border-[#f1f5f9]">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-3 text-sm resize-none min-h-[45px] max-h-[150px] outline-none focus:bg-white focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/5"
            rows={1}
            placeholder="AIと話すにはここに入力..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="chat-send-btn px-7 py-3 bg-[#0f172a] hover:bg-[#334155] text-white font-bold rounded-xl transition-all hover:scale-[1.02] disabled:opacity-60"
            disabled={sending}
            onClick={handleSend}
          >
            送信
          </button>
        </div>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[9999] p-5">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] px-6 py-7 text-center">
            <p className="text-2xl mb-2.5">🗑️</p>
            <p className="text-[#1e293b] font-medium leading-relaxed mb-5">
              {confirmTarget.type === "all" ? `${history.length}件の履歴をすべて削除しますか?` : "このメッセージを削除しますか?"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="flex-1 max-w-[160px] py-2.5 rounded-[10px] bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                onClick={() => setConfirmTarget(null)}
              >
                キャンセル
              </button>
              <button
                className="flex-1 max-w-[160px] py-2.5 rounded-[10px] bg-[#ef4444] text-white font-bold hover:bg-[#dc2626]"
                onClick={runConfirm}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3 items-start">
      <Image
        src="/assets/images/chat_logo.png"
        alt="AI"
        width={32}
        height={32}
        className="rounded-full shrink-0"
      />
      <div className="bg-white border border-[#e2e8f0] rounded-[18px] rounded-tl-[4px] px-5 py-3.5 max-w-[80%] text-sm text-[#334155] whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
