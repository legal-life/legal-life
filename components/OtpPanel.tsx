"use client";

import { useState } from "react";

export type OtpVerifyResult = { ok: boolean; reason?: string };

export default function OtpPanel({
  title = "認証コードを入力",
  desc = "",
  onVerify,
  onCancel,
}: {
  title?: string;
  desc?: string;
  onVerify: (input: string) => Promise<OtpVerifyResult>;
  onCancel?: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const input = code.trim();
    if (!input) {
      setError("コードを入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await onVerify(input);
    if (!res.ok) {
      setError(res.reason || "コードが正しくありません");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001] p-5">
      <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] px-7 py-8 text-center">
        <p className="text-lg font-bold text-[#222] mb-2.5">{title}</p>
        <p className="text-sm text-[#666] leading-relaxed mb-5">{desc}</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          className="w-full border-2 border-[#e0e0e0] rounded-[10px] py-3.5 text-3xl font-bold text-center tracking-[12px] outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <p className="text-sm text-[#e74c3c] min-h-[20px] my-2">{error}</p>
        <div className="flex gap-2.5 mt-1">
          <button
            type="button"
            className="flex-1 py-2.5 rounded-lg border-[1.5px] border-[#ddd] bg-white text-[#555] font-bold text-sm hover:bg-[#f5f5f5]"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="flex-[2] py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark disabled:opacity-60"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "確認中..." : "確認する"}
          </button>
        </div>
      </div>
    </div>
  );
}
