"use client";

import { useState } from "react";

export type OtpVerifyResult = { ok: boolean; reason?: string };

export default function OtpPanel({
  title = "認証コードを入力",
  desc = "",
  showBackup = false,
  onVerify,
  onCancel,
}: {
  title?: string;
  desc?: string;
  showBackup?: boolean;
  onVerify: (input: string, isBackup: boolean) => Promise<OtpVerifyResult>;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const input = code.trim() || backup.trim();
    if (!input) {
      setError("コードを入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await onVerify(input, !!backup.trim() && !code.trim());
    if (!res.ok) {
      setError(res.reason || "コードが正しくありません");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mt-4">
      <p className="font-bold mb-1 text-sm">{title}</p>
      <p className="text-sm text-gray-600 mb-3">{desc}</p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        autoComplete="one-time-code"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none mb-2 text-center tracking-[0.5em] font-mono"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      {showBackup && (
        <>
          <p className="text-xs text-gray-500 my-2">または バックアップコードを使用</p>
          <input
            type="text"
            maxLength={16}
            placeholder="XXXXXXXX"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none mb-2"
            value={backup}
            onChange={(e) => setBackup(e.target.value)}
          />
        </>
      )}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2 justify-end mt-2">
        <button type="button" className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100" onClick={onCancel}>
          キャンセル
        </button>
        <button
          type="button"
          className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-60"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "確認中..." : "確認する"}
        </button>
      </div>
    </div>
  );
}
