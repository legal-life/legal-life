"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { logAct } from "@/lib/auth/session";
import { getProfile, updateDisplayName, type Profile } from "@/lib/auth/profile";
import { IconPerson, IconCheck } from "@/components/icons";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifySending, setVerifySending] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      setProfile(await getProfile(u.id));
    })();
  }, []);

  const needsVerify = !!user?.email && !user.email_confirmed_at;

  const saveName = async () => {
    if (!nameInput.trim()) {
      setNameMsg("名前を入力してください");
      return;
    }
    try {
      await updateDisplayName(user!.id, nameInput.trim());
      await logAct(user!.id, "profile_update", "表示名変更");
      setProfile((p) => (p ? { ...p, display_name: nameInput.trim() } : p));
      setEditingName(false);
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const copyUuid = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(user.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resendVerify = async () => {
    if (!user?.email) return;
    setVerifySending(true);
    setVerifyMsg("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${location.origin}/account/login` },
      });
      if (error) throw error;
      setVerifyMsg("確認メールを送信しました");
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      setVerifyMsg(code === "over_email_send_rate_limit" ? "しばらく待ってから再試行してください" : e instanceof Error ? e.message : String(e));
    } finally {
      setTimeout(() => setVerifySending(false), 60000);
    }
  };

  if (!user) return null;

  const lastLogin = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "--";

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-5">プロフィール</h1>

      <div className="flex justify-center mb-5">
        {profile?.photo_url ? (
          <Image src={profile.photo_url} alt="avatar" width={72} height={72} className="rounded-full object-cover border-2 border-primary" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-[#e0e0e0] flex items-center justify-center">
            <IconPerson className="w-9 h-9 text-[#9aa0a6]" />
          </div>
        )}
      </div>

      <ul className="divide-y border border-[#dadce0] rounded-xl bg-white mb-5">
        <li className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">ユーザー名</p>
            {editingName ? (
              <div className="flex gap-2 mt-1">
                <input
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={50}
                />
                <button className="text-sm text-primary-dark font-semibold" onClick={saveName}>保存</button>
                <button className="text-sm text-gray-400" onClick={() => setEditingName(false)}>取消</button>
              </div>
            ) : (
              <p className="font-semibold text-sm">{profile?.display_name || "（未設定）"}</p>
            )}
            {nameMsg && <p className="text-xs text-[#e74c3c]">{nameMsg}</p>}
          </div>
          {!editingName && (
            <button
              className="text-xs text-primary-dark font-semibold"
              onClick={() => {
                setNameInput(profile?.display_name || "");
                setEditingName(true);
              }}
            >
              編集
            </button>
          )}
        </li>
        <li className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">メールアドレス</p>
            <p className="font-semibold text-sm">{user.email || "（未設定）"}</p>
          </div>
        </li>
        <li className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-gray-500">UUID</p>
            <p className="font-mono text-xs">{user.id}</p>
          </div>
          <button className="text-xs text-primary-dark font-semibold" onClick={copyUuid}>
            {copied ? <IconCheck className="inline w-3.5 h-3.5" /> : "コピー"}
          </button>
        </li>
        <li className="px-4 py-3">
          <p className="text-xs text-gray-500">最終ログイン</p>
          <p className="font-semibold text-sm">{lastLogin}</p>
        </li>
      </ul>

      {needsVerify && (
        <div className="bg-[#fffdf0] border border-[#ffc107]/70 rounded-xl p-4 mb-5">
          <p className="font-bold text-sm mb-1">メールアドレスが未確認です</p>
          <p className="text-xs text-[#856404] mb-3">一部のセキュリティ機能はメール確認後に利用できます。</p>
          <button
            className="bg-primary text-white text-sm font-bold rounded-lg px-4 py-2 disabled:opacity-60"
            disabled={verifySending}
            onClick={resendVerify}
          >
            確認メールを再送する
          </button>
          {verifyMsg && <p className="text-xs mt-2">{verifyMsg}</p>}
        </div>
      )}

      <p className="text-xs font-bold text-gray-500 mb-2">危険な操作</p>
      <Link
        href="/account/delete"
        className="block w-full text-center bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold rounded-lg py-2.5 text-sm"
      >
        アカウントを削除する
      </Link>

      <div className="text-center mt-5">
        <Link href="/account/settings" className="text-sm text-primary-dark font-semibold">アカウント設定に戻る</Link>
      </div>
    </div>
  );
}
