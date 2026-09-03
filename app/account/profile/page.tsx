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
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";
import MdListItem from "@/components/material/MdListItem";

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
        options: { emailRedirectTo: `${location.origin}/welcome` },
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
    <MdAccountCard backHref="/account" backLabel="アカウント設定に戻る" title="プロフィール">
      <div className="flex justify-center mb-5 mt-4">
        {profile?.photo_url ? (
          <Image src={profile.photo_url} alt="avatar" width={72} height={72} className="rounded-full object-cover border-2 border-md-primary" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-md-surface-container-high flex items-center justify-center">
            <IconPerson className="w-9 h-9 text-md-on-surface-variant" />
          </div>
        )}
      </div>

      <div className="space-y-2 mb-5">
        <MdListItem className="justify-between">
          <div>
            <p className="text-m3-body-small text-md-on-surface-variant">ユーザー名</p>
            {editingName ? (
              <div className="flex gap-2 mt-1">
                <input
                  className="border border-md-outline rounded-m3-xs px-2 py-1 text-m3-body-medium bg-md-surface-container-lowest text-md-on-surface"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={50}
                />
                <button className="text-m3-label-large text-md-primary font-medium" onClick={saveName}>保存</button>
                <button className="text-m3-label-large text-md-on-surface-variant" onClick={() => setEditingName(false)}>取消</button>
              </div>
            ) : (
              <p className="font-semibold text-m3-body-medium text-md-on-surface">{profile?.display_name || "（未設定）"}</p>
            )}
            {nameMsg && <p className="text-m3-body-small text-md-error">{nameMsg}</p>}
          </div>
          {!editingName && (
            <button
              className="text-m3-label-large text-md-primary font-medium"
              onClick={() => {
                setNameInput(profile?.display_name || "");
                setEditingName(true);
              }}
            >
              編集
            </button>
          )}
        </MdListItem>
        <MdListItem>
          <div>
            <p className="text-m3-body-small text-md-on-surface-variant">メールアドレス</p>
            <p className="font-semibold text-m3-body-medium text-md-on-surface">{user.email || "（未設定）"}</p>
          </div>
        </MdListItem>
        <MdListItem className="justify-between">
          <div>
            <p className="text-m3-body-small text-md-on-surface-variant">UUID</p>
            <p className="font-mono text-m3-body-small text-md-on-surface">{user.id}</p>
          </div>
          <button className="text-m3-label-large text-md-primary font-medium shrink-0" onClick={copyUuid}>
            {copied ? <IconCheck className="inline w-3.5 h-3.5" /> : "コピー"}
          </button>
        </MdListItem>
        <MdListItem>
          <div>
            <p className="text-m3-body-small text-md-on-surface-variant">最終ログイン</p>
            <p className="font-semibold text-m3-body-medium text-md-on-surface">{lastLogin}</p>
          </div>
        </MdListItem>
      </div>

      {needsVerify && (
        <div className="rounded-m3-md bg-md-secondary-container p-4 mb-5">
          <p className="font-bold text-m3-body-medium text-md-on-secondary-container mb-1">メールアドレスが未確認です</p>
          <p className="text-m3-body-small text-md-on-secondary-container mb-3">一部のセキュリティ機能はメール確認後に利用できます。</p>
          <MdButton variant="filled" disabled={verifySending} onClick={resendVerify}>
            確認メールを再送する
          </MdButton>
          {verifyMsg && <p className="text-m3-body-small text-md-on-secondary-container mt-2">{verifyMsg}</p>}
        </div>
      )}

      <p className="text-m3-label-small text-md-on-surface-variant mb-2 uppercase tracking-wide">危険な操作</p>
      <Link
        href="/account/delete"
        className="flex items-center justify-center w-full h-10 rounded-full bg-md-error text-md-on-error text-m3-label-large font-medium hover:shadow-m3-1 transition-shadow"
      >
        アカウントを削除する
      </Link>

      <div className="text-center mt-5">
        <Link href="/account" className="text-m3-body-medium text-md-primary font-medium">アカウント設定に戻る</Link>
      </div>
    </MdAccountCard>
  );
}
