"use client";

import { useState } from "react";
import MdButton from "@/components/material/MdButton";

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
    // Enterキーはボタンのdisabled状態を経由しないため、ここでガードしないと
    // 連打で二重にonVerify(検証API呼び出し)が発行されてしまう
    // (試行回数制限のあるOTP検証では、意図せず残り試行回数を消費するバグになる)。
    if (submitting) return;
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
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-md-on-surface/40 p-5">
      <div className="w-full max-w-[380px] rounded-m3-xl bg-md-surface-container-high px-7 py-8 text-center shadow-m3-3">
        <p className="mb-2.5 text-m3-headline-small text-md-on-surface">{title}</p>
        <p className="mb-5 text-m3-body-medium leading-relaxed text-md-on-surface-variant">{desc}</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoComplete="one-time-code"
          className="w-full rounded-m3-sm border-2 border-md-outline-variant bg-md-surface-container-lowest py-3.5 text-center text-3xl font-bold tracking-[12px] text-md-on-surface outline-none transition-colors focus:border-md-primary"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <p className="my-2 min-h-[20px] text-m3-body-small text-md-error">{error}</p>
        <div className="mt-1 flex gap-2.5">
          <MdButton variant="outlined" className="flex-1" onClick={onCancel}>
            キャンセル
          </MdButton>
          <MdButton variant="filled" className="flex-[2]" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "確認中..." : "確認する"}
          </MdButton>
        </div>
      </div>
    </div>
  );
}
