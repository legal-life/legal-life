"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { genOTP, is2FA, saveOTP, sendOTP, verifyOTP, clearOTP, tryBackup } from "@/lib/auth/otp";
import OtpPanel from "@/components/OtpPanel";

const PASS_COOKIE = "account-Passage";

function hasPassage() {
  return document.cookie.split(";").some((c) => c.trim().startsWith(PASS_COOKIE + "=valid"));
}
function setPassage() {
  const exp = new Date(Date.now() + 30 * 60 * 1000).toUTCString();
  document.cookie = `${PASS_COOKIE}=valid; path=/account/security/; expires=${exp}; SameSite=Strict`;
}

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [enabled2fa, setEnabled2fa] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [needsGate, setNeedsGate] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      const db = getFirebaseDb();
      const tfSnap = await getDoc(doc(db, "users", u.uid, "security", "twoFactor")).catch(() => null);
      const en = tfSnap?.exists() && (tfSnap.data().enabled ?? false);
      setEnabled2fa(!!en);
      setHasPassword(u.providerData.some((p) => p.providerId === "password"));

      if (en && u.email && !hasPassage()) {
        setNeedsGate(true);
        try {
          const code = genOTP();
          await saveOTP(u.uid, db, code, "security_access");
          await sendOTP(u, code, "セキュリティセクションへのアクセス");
          setOtpMsg(`📧 ${u.email} に認証コードを送信しました`);
        } catch (e) {
          setOtpMsg("コード送信に失敗しました: " + (e instanceof Error ? e.message : String(e)));
        }
        return;
      }
      setUser(u);
    })();
  }, []);

  const handleOtpVerify = async (input: string, isBackup: boolean) => {
    const u = await requireAuth();
    const db = getFirebaseDb();
    if (isBackup) {
      const res = await tryBackup(u.uid, db, input);
      if (!res.ok) return res;
    } else {
      const res = await verifyOTP(u.uid, db, input, "security_access");
      if (!res.ok) return res;
      await clearOTP(u.uid, db);
    }
    setPassage();
    window.location.reload();
    return { ok: true };
  };

  if (needsGate) {
    return (
      <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
        <h1 className="text-xl font-bold mb-1">セキュリティ</h1>
        <p className="text-sm text-gray-500 mb-4">アクセスするには本人確認が必要です</p>
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-2">
          <p className="font-bold text-sm mb-1">二段階認証が有効です</p>
          <p className="text-xs text-gray-600">セキュリティ設定を表示するには認証コードが必要です。</p>
        </div>
        {otpMsg && <p className="text-sm my-2">{otpMsg}</p>}
        <OtpPanel
          title="本人確認"
          desc="認証コードを入力してください"
          showBackup
          onVerify={handleOtpVerify}
          onCancel={() => window.location.replace("/account/settings")}
        />
        <div className="mt-4">
          <Link href="/account/settings" className="text-sm text-gray-500">アカウント設定に戻る</Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const lastSignIn = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "--";

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3">セキュリティ</h1>
      <p className="text-sm text-gray-500 mb-5">最終ログイン: {lastSignIn}</p>

      <p className="text-xs font-bold text-gray-500 mb-2">ログインとパスワード</p>
      <nav className="space-y-2 mb-5">
        <Link href="/account/security/pass" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">パスワード</p>
            <p className="text-xs text-gray-500">{hasPassword ? "設定済み" : "未設定"}</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
        <Link href="/account/security/2fa" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">二段階認証</p>
            <p className={`text-xs ${enabled2fa ? "text-green-600" : "text-gray-500"}`}>{enabled2fa ? "有効" : "無効"}</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
        <Link href="/account/security/methods" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">ログイン方法</p>
            <p className="text-xs text-gray-500">メール・Google連携の管理</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      </nav>

      <p className="text-xs font-bold text-gray-500 mb-2">アクティビティ</p>
      <nav className="space-y-2 mb-5">
        <Link href="/account/security/activity" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">最近のアクティビティ</p>
            <p className="text-xs text-gray-500">ログイン・設定変更の履歴(最大1年)</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
        <Link href="/account/security/device" className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50">
          <div className="flex-1">
            <p className="font-semibold text-sm">ログイン中のデバイス</p>
            <p className="text-xs text-gray-500">アクティブなセッションの管理</p>
          </div>
          <span className="text-gray-300">›</span>
        </Link>
      </nav>

      <div className="text-center">
        <Link href="/account/settings" className="text-sm text-primary-dark font-semibold">アカウント設定に戻る</Link>
      </div>
    </div>
  );
}
