"use client";

import Image from "next/image";
import Link from "next/link";
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">法令専門AIチャット</h1>
        <p className="text-sm text-gray-500 mt-2">
          日本の法令に関して聞かれたことに対してAIが詳しく回答します。
          <br />
          履歴はご利用中の端末もしくはサーバーに自動で保存されます。
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="font-bold text-sm mb-2">⚠️ 重要な注意事項</p>
        <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
          <li>個人情報(氏名、住所、電話番号等)は絶対に入力しないでください</li>
          <li>本サービスは法的助言ではありません</li>
          <li>AI生成の回答には誤りが含まれる可能性があります</li>
          <li>重要な判断には必ず専門家にご相談ください</li>
        </ul>
        <p className="text-xs text-amber-700 mt-2">
          当機能利用時は当サイト{" "}
          <Link href="/law/disclaimer" className="underline">免責事項</Link>{" "}
          並びに{" "}
          <Link href="/law/privacy#section6" className="underline">AI利用に関する詳細情報開示</Link>{" "}
          に同意したものをみなします。
        </p>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-4 text-sm">
        💡 わからない法令名は{" "}
        <Link href="/content/search" className="text-primary-dark font-semibold underline">法令検索</Link>{" "}
        ページで調べてみよう!
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-semibold">
            法令専門AIチャット
            <span className="ml-2 text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 rounded px-1.5 py-0.5">
              テスト中の機能
            </span>
          </span>
          <button className="text-xs text-gray-400 underline" onClick={clearAll}>全削除</button>
        </div>

        <div ref={areaRef} className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
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

        <div className="flex gap-2 items-end p-3 border-t border-gray-200">
          <textarea
            ref={textareaRef}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none max-h-[150px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
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
            className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60"
            disabled={sending}
            onClick={handleSend}
          >
            送信
          </button>
        </div>
      </div>
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
