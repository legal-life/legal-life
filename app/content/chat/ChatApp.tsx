"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "legalChatHistory";
const MAX_INPUT_LEN = 1000;

type ChatItem = { id: string; question: string; answer: string };

export default function ChatApp() {
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const persist = (next: ChatItem[]) => {
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

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
      const item: ChatItem = { id: Date.now().toString(), question, answer: data.answer };
      persist([...history, item]);
      setTimeout(() => {
        areaRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const deleteItem = (id: string) => {
    if (!confirm("このメッセージを削除しますか?")) return;
    persist(history.filter((i) => i.id !== id));
  };

  const clearAll = () => {
    if (history.length === 0) return;
    if (!confirm(`${history.length}件の履歴をすべて削除しますか?`)) return;
    persist([]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold">AIチャット(法令相談)</h1>
        <button className="text-xs text-gray-400 underline" onClick={clearAll}>すべて削除</button>
      </div>

      <div ref={areaRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {history.length === 0 && (
          <AiBubble text="こんにちは!日本の法令に関する一般的な仕組みや制度について、AIがお答えします。何かお困りですか?" />
        )}
        {history.map((item) => (
          <div key={item.id}>
            <div className="flex justify-end mb-2 group">
              <button
                className="opacity-0 group-hover:opacity-100 text-xs mr-2 self-center"
                onClick={() => deleteItem(item.id)}
              >
                🗑️
              </button>
              <div className="bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap">
                {item.question}
              </div>
            </div>
            <AiBubble text={item.answer} />
          </div>
        ))}
        {sending && <AiBubble text="考え中..." />}
        {error && <p className="text-sm text-red-600">⚠️ {error}</p>}
      </div>

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none max-h-[150px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          rows={1}
          placeholder="法令について質問する..."
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
          className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60"
          disabled={sending}
          onClick={handleSend}
        >
          送信
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        ※本チャットはAIによる一般的な法令情報の提供です。個別の法的判断が必要な場合は専門家にご相談ください。
      </p>
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <Image
        src="/assets/images/chat_logo.png"
        alt="AI"
        width={32}
        height={32}
        className="rounded-full shrink-0"
      />
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}
