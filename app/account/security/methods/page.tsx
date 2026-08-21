"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  unlink,
  updateEmail,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { logAct } from "@/lib/auth/session";
import { getFirebaseDb } from "@/lib/firebase/client";

export default function MethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  useEffect(() => {
    (async () => {
      setUser(await requireAuth());
    })();
  }, []);

  const refresh = () => setUser(getFirebaseAuth().currentUser);

  if (!user) return null;

  const ids = user.providerData.map((p) => p.providerId);
  const total = ids.length;
  const passLinked = ids.includes("password");
  const passData = user.providerData.find((p) => p.providerId === "password");
  const googleLinked = ids.includes("google.com");
  const googleData = user.providerData.find((p) => p.providerId === "google.com");

  const unlinkProvider = async (providerId: "password" | "google.com", label: string) => {
    if (!confirm("解除しますか?")) return;
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      await unlink(auth.currentUser!, providerId);
      await logAct(user.uid, db, "method_change", `${label}解除`);
      setMsg("✅解除しました");
      refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const linkGoogle = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      await linkWithPopup(auth.currentUser!, new GoogleAuthProvider());
      setMsg("✅連携しました");
      await logAct(user.uid, db, "method_change", "Google連携");
      refresh();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      setMsg(code === "auth/credential-already-in-use" ? "このGoogleアカウントは別のユーザーと連携済みです" : e instanceof Error ? e.message : String(e));
    }
  };

  const setPassword = async () => {
    if (!pw1 || pw1.length < 6) return setPwMsg("6文字以上にしてください");
    if (pw1 !== pw2) return setPwMsg("一致しません");
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      await linkWithCredential(auth.currentUser!, EmailAuthProvider.credential(auth.currentUser!.email!, pw1));
      await logAct(user.uid, db, "method_change", "パスワード設定");
      setShowPasswordForm(false);
      setPw1("");
      setPw2("");
      setMsg("✅パスワードを設定しました");
      refresh();
    } catch (e) {
      setPwMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const setEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) return setEmailMsg("正しいメールアドレスを入力してください");
    setEmailSubmitting(true);
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      await updateEmail(auth.currentUser!, emailInput);
      await sendEmailVerification(auth.currentUser!).catch(() => {});
      setEmailMsg("✅設定しました");
      await logAct(user.uid, db, "email_change", "");
      refresh();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const M: Record<string, string> = {
        "auth/email-already-in-use": "すでに使用済み",
        "auth/requires-recent-login": "再ログインが必要です",
      };
      setEmailMsg((code && M[code]) || (e instanceof Error ? e.message : String(e)));
    } finally {
      setEmailSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">ログイン方法</h1>
      <p className="text-sm text-gray-500 mb-5">サインインに使用する方法を管理します</p>

      <div className="border-t border-[#dadce0]">
        <div className="flex items-center gap-3 py-3.5 border-b border-[#dadce0]">
          <span className="w-[30px] text-center text-xl shrink-0">✉️</span>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold">メール / パスワード</span>
            <span className={`block text-xs mt-0.5 ${passLinked ? "text-[#27ae60] font-bold" : "text-[#5f6368]"}`}>
              {passLinked ? "設定済み" : "未設定"}
            </span>
            {passLinked && <span className="block text-xs text-[#5f6368] italic mt-0.5">{passData?.email || user.email}</span>}
          </div>
          {passLinked ? (
            <button
              className="shrink-0 whitespace-nowrap bg-white text-[#e74c3c] border-[1.5px] border-[#e74c3c] rounded-md px-3.5 py-1.5 text-sm font-bold hover:bg-[#fff5f5] disabled:opacity-40"
              disabled={total <= 1}
              title={total <= 1 ? "最後のログイン方法は解除できません" : ""}
              onClick={() => unlinkProvider("password", "パスワード")}
            >
              解除する
            </button>
          ) : (
            <button
              className="shrink-0 bg-primary text-white rounded-md px-3.5 py-1.5 text-sm font-bold hover:bg-primary-dark disabled:opacity-40"
              disabled={!user.email}
              onClick={() => setShowPasswordForm(true)}
            >
              設定する
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 py-3.5">
          <span className="w-[30px] text-center text-xl shrink-0">🔍</span>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold">Google</span>
            <span className={`block text-xs mt-0.5 ${googleLinked ? "text-[#27ae60] font-bold" : "text-[#5f6368]"}`}>
              {googleLinked ? "連携済み" : "未連携"}
            </span>
            {googleLinked && <span className="block text-xs text-[#5f6368] italic mt-0.5">{googleData?.email}</span>}
          </div>
          {googleLinked ? (
            <button
              className="shrink-0 whitespace-nowrap bg-white text-[#e74c3c] border-[1.5px] border-[#e74c3c] rounded-md px-3.5 py-1.5 text-sm font-bold hover:bg-[#fff5f5] disabled:opacity-40"
              disabled={total <= 1}
              onClick={() => unlinkProvider("google.com", "Google")}
            >
              解除する
            </button>
          ) : (
            <button
              className="shrink-0 bg-primary text-white rounded-md px-3.5 py-1.5 text-sm font-bold hover:bg-primary-dark"
              onClick={linkGoogle}
            >
              連携する
            </button>
          )}
        </div>
      </div>

      {msg && <p className="text-sm mt-3">{msg}</p>}

      {showPasswordForm && (
        <div className="border rounded-xl p-4 mt-4">
          <p className="font-bold text-sm mb-3">パスワードを設定する</p>
          <div className="mb-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">パスワード(6文字以上)</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={pw1} onChange={(e) => setPw1(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-bold text-gray-600 mb-1">確認</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          {pwMsg && <p className="text-sm text-[#e74c3c] mb-2">{pwMsg}</p>}
          <div className="flex gap-2 justify-end">
            <button className="text-sm px-4 py-2 rounded-lg border border-gray-300" onClick={() => setShowPasswordForm(false)}>キャンセル</button>
            <button className="text-sm px-4 py-2 rounded-lg bg-primary text-white font-semibold" onClick={setPassword}>設定する</button>
          </div>
        </div>
      )}

      {!user.email && (
        <div className="bg-[#f0fbfe] border border-primary/60 rounded-xl p-4 mt-4">
          <p className="font-bold text-sm mb-2">メールアドレスを設定する</p>
          <p className="text-xs text-gray-600 mb-3">パスワードログインにはメールアドレスが必要です。</p>
          <input
            type="email"
            placeholder="メールアドレス"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
          {emailMsg && <p className="text-sm mb-2">{emailMsg}</p>}
          <button className="bg-primary text-white text-sm font-bold rounded-lg px-4 py-2 disabled:opacity-60" disabled={emailSubmitting} onClick={setEmail}>
            設定する
          </button>
        </div>
      )}

      <div className="mt-6">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
