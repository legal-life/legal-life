"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { genOTP, is2FA, saveOTP, sendOTP, verifyOTP, clearOTP } from "@/lib/auth/otp";
import { logAct } from "@/lib/auth/session";
import OtpPanel from "@/components/OtpPanel";

export default function TwoFaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [recommend, setRecommend] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      setEnabled(await is2FA(u.uid, db));
    })();
  }, []);

  const handleToggle = async (checked: boolean) => {
    if (!user?.email) {
      setMsg("メールアドレスが必要です");
      return;
    }
    setToggling(true);
    setMsg("認証コードを送信中...");
    const db = getFirebaseDb();
    const purpose = checked ? "2fa_enable" : "2fa_disable";
    try {
      const code = genOTP();
      await saveOTP(user.uid, db, code, purpose);
      await sendOTP(user, code, checked ? "二段階認証の有効化" : "二段階認証の無効化");
      setMsg(`📧 ${user.email} に認証コードを送信しました`);
      setPendingState(checked);
      setShowOtp(true);
    } catch {
      setMsg("送信に失敗しました");
      setToggling(false);
    }
  };

  const handleOtpVerify = async (input: string) => {
    if (!user || pendingState === null) return { ok: false, reason: "状態が失われました" };
    const db = getFirebaseDb();
    const purpose = pendingState ? "2fa_enable" : "2fa_disable";
    const res = await verifyOTP(user.uid, db, input, purpose);
    if (!res.ok) {
      setToggling(false);
      return res;
    }
    await clearOTP(user.uid, db);
    await setDoc(doc(db, "users", user.uid, "security", "twoFactor"), { enabled: pendingState }, { merge: true });
    if (!pendingState) {
      await deleteDoc(doc(db, "users", user.uid, "security", "BackUpCode")).catch(() => {});
    }
    setEnabled(pendingState);
    setMsg(`✅ 二段階認証を${pendingState ? "有効" : "無効"}にしました`);
    await logAct(user.uid, db, "twofa_change", pendingState ? "有効化" : "無効化");
    setToggling(false);
    setShowOtp(false);
    if (pendingState) setRecommend(true);
    return { ok: true };
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">二段階認証</h1>
      <p className="text-sm text-gray-500 mb-5">アカウントのセキュリティをさらに強化</p>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
        <div>
          <p className="font-bold text-sm">二段階認証</p>
          <p className={`text-xs mt-1 ${enabled ? "text-green-600" : "text-gray-500"}`}>{enabled ? "有効" : "無効"}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            disabled={toggling}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-primary transition-colors" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        有効にすると、ログイン時にメールアドレスへ送信される6桁のコードが必要になります。
        2FAが使えない場合はバックアップコードでログインできます。
      </p>

      {msg && !showOtp && <p className="text-sm mb-3">{msg}</p>}

      {showOtp && (
        <OtpPanel
          title="本人確認"
          desc="コードを入力してください"
          onVerify={handleOtpVerify}
          onCancel={() => {
            setShowOtp(false);
            setToggling(false);
          }}
        />
      )}

      {recommend && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 my-4">
          <p className="font-bold text-sm mb-1">✅ 二段階認証を有効にしました!</p>
          <p className="text-xs text-gray-600 mb-3">さらにセキュリティを強化するために以下の設定もお勧めします。</p>
          <div className="flex flex-col gap-2">
            <Link href="/account/security/2fa/backup-code" className="text-center bg-primary text-white text-sm font-bold rounded-lg py-2">
              バックアップコードを設定する
            </Link>
            <Link href="/account/security/methods" className="text-center border border-gray-300 text-sm font-semibold rounded-lg py-2">
              ログイン方法を確認する
            </Link>
          </div>
        </div>
      )}

      <p className="text-xs font-bold text-gray-500 mb-2 mt-5">バックアップ</p>
      {enabled ? (
        <Link href="/account/security/2fa/backup-code" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">バックアップコード</p>
            <p className="text-xs text-gray-500">2FAが使えない場合の緊急用コード</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 opacity-40">
          <div className="flex-1">
            <p className="font-semibold text-sm">バックアップコード</p>
            <p className="text-xs text-gray-500">二段階認証を有効にすると使えます</p>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
