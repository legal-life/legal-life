"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, updatePassword, type User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { logAct } from "@/lib/auth/session";
import { genOTP, is2FA, saveOTP, sendOTP, verifyOTP, clearOTP } from "@/lib/auth/otp";
import OtpPanel from "@/components/OtpPanel";

export default function PassPage() {
  const [user, setUser] = useState<User | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      setHasPassword(u.providerData.some((p) => p.providerId === "password"));
    })();
  }, []);

  const execChange = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    const cu = auth.currentUser;
    if (!cu) throw new Error("再ログインが必要です");
    try {
      if (hasPassword) {
        const cred = EmailAuthProvider.credential(cu.email!, current);
        await reauthenticateWithCredential(cu, cred);
        await updatePassword(cu, newPass);
      } else {
        const cred = EmailAuthProvider.credential(cu.email!, newPass);
        await linkWithCredential(cu, cred);
      }
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setMsg({ text: "✅ 変更しました", type: "success" });
      await logAct(user!.uid, db, "password_change", "");
      setHasPassword(true);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const M: Record<string, string> = {
        "auth/wrong-password": "現在のパスワードが間違っています",
        "auth/invalid-credential": "現在のパスワードが間違っています",
        "auth/requires-recent-login": "再ログインが必要です",
      };
      setMsg({ text: (code && M[code]) || (e instanceof Error ? e.message : String(e)), type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!newPass) return setMsg({ text: "新しいパスワードを入力してください", type: "error" });
    if (newPass.length < 6) return setMsg({ text: "6文字以上にしてください", type: "error" });
    if (newPass !== confirm) return setMsg({ text: "パスワードが一致しません", type: "error" });
    if (hasPassword && !current) return setMsg({ text: "現在のパスワードを入力してください", type: "error" });

    setSubmitting(true);
    setMsg({ text: "", type: "" });
    const db = getFirebaseDb();
    const en = await is2FA(user!.uid, db);
    if (en && user!.email) {
      const code = genOTP();
      await saveOTP(user!.uid, db, code, "password_change");
      await sendOTP(user!, code, "パスワード変更");
      setMsg({ text: `📧 ${user!.email} に認証コードを送信しました`, type: "success" });
      setShowOtp(true);
      return;
    }
    await execChange();
  };

  const handleOtpVerify = async (input: string) => {
    const db = getFirebaseDb();
    const res = await verifyOTP(user!.uid, db, input, "password_change");
    if (!res.ok) {
      setSubmitting(false);
      return res;
    }
    await clearOTP(user!.uid, db);
    await execChange();
    return { ok: true };
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">{hasPassword ? "パスワードを変更する" : "パスワードを設定する"}</h1>
      <p className="text-sm text-gray-500 mb-5">安全なパスワードでアカウントを保護しましょう</p>

      {!showOtp && (
        <div>
          {hasPassword && (
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="current-password">現在のパスワード</label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          )}
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="new-password">新しいパスワード</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="6文字以上"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="confirm-password">パスワード(確認)</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="もう一度入力"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {msg.text && <p className={`text-sm mb-2 ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>{msg.text}</p>}
          <button
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-60"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {hasPassword ? "パスワードを変更する" : "パスワードを設定する"}
          </button>
        </div>
      )}

      {showOtp && (
        <OtpPanel
          title="本人確認"
          desc="コードを入力してください"
          onVerify={handleOtpVerify}
          onCancel={() => {
            setShowOtp(false);
            setSubmitting(false);
          }}
        />
      )}

      <div className="mt-4">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
