"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { is2FA, genOTP, saveOTP, sendOTP, verifyOTP, clearOTP } from "@/lib/auth/otp";
import { logAct } from "@/lib/auth/session";
import { genAndSaveCodes, loadCodes, type BackupCode } from "@/lib/auth/backupCodes";

export default function BackupCodePage() {
  const [user, setUser] = useState<User | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<BackupCode[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      const en = await is2FA(u.uid, db);
      setEnabled(en);
      if (en) {
        setCodes(await loadCodes(u.uid, db));
      }
      setLoading(false);
    })();
  }, []);

  const regenerate = async () => {
    if (!user) return;
    if (!confirm("現在のコードはすべて無効になります。よろしいですか?")) return;
    const db = getFirebaseDb();
    const doRegen = async () => {
      const nc = await genAndSaveCodes(user.uid, db);
      setCodes(nc);
      await logAct(user.uid, db, "twofa_change", "バックアップコード再生成");
    };
    const en = await is2FA(user.uid, db);
    if (en && user.email) {
      const code = genOTP();
      await saveOTP(user.uid, db, code, "backup_regen");
      await sendOTP(user, code, "バックアップコード再生成");
      const answer = window.prompt("メールに送信された6桁の認証コードを入力してください:");
      if (!answer) return;
      const res = await verifyOTP(user.uid, db, answer.trim(), "backup_regen");
      if (!res.ok) {
        alert(res.reason || "コードが正しくありません");
        return;
      }
      await clearOTP(user.uid, db);
    }
    await doRegen();
  };

  const copyCodes = async () => {
    const text = codes.map((c, i) => `${i + 1}. ${c.code}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || loading) return null;

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security/2fa" className="text-sm text-gray-500">← 二段階認証に戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">バックアップコード</h1>
      <p className="text-sm text-gray-500 mb-5">2FAが使えない場合の緊急ログイン用コードです</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="font-bold text-sm mb-1">⚠️ 安全な場所に保管してください</p>
        <p className="text-xs text-[#856404]">各コードは1回のみ使用可能です。誰にも見せないでください。</p>
      </div>

      {!enabled ? (
        <div className="text-center py-6 text-gray-500">
          <p className="font-bold mb-2">二段階認証が無効です</p>
          <p className="text-sm">バックアップコードを使用するには先に二段階認証を有効にしてください。</p>
          <Link href="/account/security/2fa" className="inline-block mt-3 text-primary-dark font-semibold text-sm">
            二段階認証の設定へ →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {codes.map((c, i) => (
              <div key={i} className={`border rounded-lg px-3 py-2 text-sm font-mono ${c.used ? "text-gray-400 line-through bg-gray-50" : ""}`}>
                {i + 1}. {c.code}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-semibold" onClick={copyCodes}>
              {copied ? "✅ コピー済み" : "コードをコピー"}
            </button>
            <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-semibold" onClick={regenerate}>
              再生成する
            </button>
          </div>
        </>
      )}

      <div className="mt-6">
        <Link href="/account/security/2fa" className="text-sm text-gray-500">二段階認証設定に戻る</Link>
      </div>
    </div>
  );
}
