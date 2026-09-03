"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { logAct } from "@/lib/auth/session";
import { sendNotice } from "@/lib/auth/notifications";
import { listPasskeys, registerPasskey, deletePasskey, type PasskeyItem } from "@/lib/auth/passkey";
import { validatePassword } from "@/lib/auth/utils";
import { IconMail, IconGoogleLogo, IconLock, IconTrash } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";
import MdTextField from "@/components/material/MdTextField";
import MdListItem from "@/components/material/MdListItem";
import MdIconButton from "@/components/material/MdIconButton";
import { useSecurityGate, SecurityGateScreen } from "../SecurityGate";

export default function MethodsPage() {
  const { user: gatedUser, needsGate } = useSecurityGate();
  const [user, setUser] = useState(gatedUser);
  const [msg, setMsg] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [passkeys, setPasskeys] = useState<PasskeyItem[] | null>(null);
  const [passkeyMsg, setPasskeyMsg] = useState("");
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  useEffect(() => {
    if (!gatedUser) return;
    setUser(gatedUser);
    refreshPasskeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatedUser]);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  const refreshPasskeys = async () => {
    try {
      setPasskeys(await listPasskeys());
    } catch {
      setPasskeys([]);
    }
  };

  const addPasskey = async () => {
    setPasskeySubmitting(true);
    setPasskeyMsg("");
    try {
      await registerPasskey();
      await logAct(user!.id, "method_change", "パスキー追加");
      await refreshPasskeys();
    } catch (e) {
      setPasskeyMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setPasskeySubmitting(false);
    }
  };

  const removePasskey = async (id: string) => {
    if (!confirm("このパスキーを削除しますか?")) return;
    try {
      await deletePasskey(id);
      await logAct(user!.id, "method_change", "パスキー削除");
      await refreshPasskeys();
    } catch (e) {
      setPasskeyMsg(e instanceof Error ? e.message : String(e));
    }
  };

  if (needsGate) return <SecurityGateScreen title="ログイン方法" />;

  if (!user) return null;

  const identities = user.identities ?? [];
  const total = identities.length;
  const passIdentity = identities.find((i) => i.provider === "email");
  const passLinked = !!passIdentity;
  const googleIdentity = identities.find((i) => i.provider === "google");
  const googleLinked = !!googleIdentity;

  const unlinkProvider = async (identity: NonNullable<typeof passIdentity>, label: string) => {
    if (!confirm("解除しますか?")) return;
    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (error) {
      setMsg(error.message);
      return;
    }
    await logAct(user.id, "method_change", `${label}解除`);
    setMsg("解除しました");
    await refresh();
  };

  const linkGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${location.origin}/account/security/methods` },
    });
    if (error) {
      setMsg(error.message.includes("already") ? "このGoogleアカウントは別のユーザーと連携済みです" : error.message);
    }
  };

  const setPassword = async () => {
    if (!pw1) return setPwMsg("パスワードを入力してください");
    const pwError = validatePassword(pw1);
    if (pwError) return setPwMsg(pwError);
    if (pw1 !== pw2) return setPwMsg("一致しません");
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) {
      setPwMsg(error.message);
      return;
    }
    await logAct(user.id, "method_change", "パスワード設定");
    setShowPasswordForm(false);
    setPw1("");
    setPw2("");
    setMsg("パスワードを設定しました");
    await refresh();
  };

  const setEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) return setEmailMsg("正しいメールアドレスを入力してください");
    setEmailSubmitting(true);
    const { error } = await supabase.auth.updateUser(
      { email: emailInput },
      { emailRedirectTo: `${location.origin}/account/profile` },
    );
    if (error) {
      const M: Record<string, string> = {
        email_exists: "すでに使用済み",
      };
      setEmailMsg((error.code && M[error.code]) || error.message);
      setEmailSubmitting(false);
      return;
    }
    setEmailMsg("確認メールを送信しました。リンクから設定を完了してください");
    await logAct(user.id, "email_change", "");
    sendNotice(user.id, "email_change", "アカウントのメールアドレス設定・変更をリクエストされました", {
      email: emailInput,
      name: user.user_metadata?.full_name,
    });
    setEmailSubmitting(false);
    await refresh();
  };

  return (
    <MdAccountCard backHref="/account/security" backLabel="セキュリティに戻る" title="ログイン方法" subtitle="サインインに使用する方法を管理します">
      <div className="space-y-2 mb-5">
        <MdListItem className="justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <IconMail className="w-5 h-5 text-md-on-surface-variant shrink-0" />
            <div className="min-w-0">
              <span className="block text-m3-body-medium font-bold text-md-on-surface">メール / パスワード</span>
              <span className={`block text-m3-body-small mt-0.5 ${passLinked ? "text-[#146c2e] font-bold" : "text-md-on-surface-variant"}`}>
                {passLinked ? "設定済み" : "未設定"}
              </span>
              {passLinked && <span className="block text-m3-body-small text-md-on-surface-variant italic mt-0.5 truncate">{user.email}</span>}
            </div>
          </div>
          {passLinked ? (
            <MdButton
              variant="outlined"
              className="shrink-0 !h-9 !px-3.5 !text-md-error !border-md-error"
              disabled={total <= 1}
              title={total <= 1 ? "最後のログイン方法は解除できません" : ""}
              onClick={() => unlinkProvider(passIdentity!, "パスワード")}
            >
              解除する
            </MdButton>
          ) : (
            <MdButton variant="filled" className="shrink-0 !h-9 !px-3.5" disabled={!user.email} onClick={() => setShowPasswordForm(true)}>
              設定する
            </MdButton>
          )}
        </MdListItem>

        <MdListItem className="justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <IconGoogleLogo className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <span className="block text-m3-body-medium font-bold text-md-on-surface">Google</span>
              <span className={`block text-m3-body-small mt-0.5 ${googleLinked ? "text-[#146c2e] font-bold" : "text-md-on-surface-variant"}`}>
                {googleLinked ? "連携済み" : "未連携"}
              </span>
              {googleLinked && (
                <span className="block text-m3-body-small text-md-on-surface-variant italic mt-0.5 truncate">
                  {(googleIdentity!.identity_data as { email?: string })?.email}
                </span>
              )}
            </div>
          </div>
          {googleLinked ? (
            <MdButton
              variant="outlined"
              className="shrink-0 !h-9 !px-3.5 !text-md-error !border-md-error"
              disabled={total <= 1}
              onClick={() => unlinkProvider(googleIdentity!, "Google")}
            >
              解除する
            </MdButton>
          ) : (
            <MdButton variant="filled" className="shrink-0 !h-9 !px-3.5" onClick={linkGoogle}>
              連携する
            </MdButton>
          )}
        </MdListItem>
      </div>

      <div className="mb-5">
        <p className="text-m3-label-small text-md-on-surface-variant mb-2 uppercase tracking-wide">パスキー</p>
        {passkeys && passkeys.length > 0 && (
          <div className="space-y-2 mb-2">
            {passkeys.map((p) => (
              <MdListItem key={p.id} className="justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <IconLock className="w-4 h-4 text-md-on-surface-variant shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-m3-body-medium text-md-on-surface truncate">{p.friendly_name || "パスキー"}</p>
                    <p className="text-m3-body-small text-md-on-surface-variant">登録日: {new Date(p.created_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                </div>
                <MdIconButton tone="error" onClick={() => removePasskey(p.id)} aria-label="削除">
                  <IconTrash className="w-4 h-4" />
                </MdIconButton>
              </MdListItem>
            ))}
          </div>
        )}
        <MdButton variant="outlined" className="w-full" disabled={passkeySubmitting} onClick={addPasskey}>
          <IconLock className="w-4 h-4" />
          {passkeySubmitting ? "登録中..." : "パスキーを追加する"}
        </MdButton>
        {passkeyMsg && <p className="text-m3-body-small text-md-error mt-2">{passkeyMsg}</p>}
      </div>

      {msg && <p className="text-m3-body-medium text-md-on-surface mt-3">{msg}</p>}

      {showPasswordForm && (
        <div className="rounded-m3-md bg-md-surface-container p-4 mt-4">
          <p className="font-bold text-m3-body-medium text-md-on-surface mb-3">パスワードを設定する</p>
          <MdTextField
            label="パスワード(8文字以上、大文字・小文字・数字・記号を含む)"
            type="password"
            containerClassName="mb-3"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
          />
          <MdTextField label="確認" type="password" containerClassName="mb-2" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          {pwMsg && <p className="text-m3-body-small text-md-error mb-2">{pwMsg}</p>}
          <div className="flex gap-2 justify-end mt-2">
            <MdButton variant="text" onClick={() => setShowPasswordForm(false)}>キャンセル</MdButton>
            <MdButton variant="filled" onClick={setPassword}>設定する</MdButton>
          </div>
        </div>
      )}

      {!user.email && (
        <div className="rounded-m3-md bg-md-primary-container p-4 mt-4">
          <p className="font-bold text-m3-body-medium text-md-on-primary-container mb-2">メールアドレスを設定する</p>
          <p className="text-m3-body-small text-md-on-primary-container mb-3">パスワードログインにはメールアドレスが必要です。</p>
          <MdTextField label="メールアドレス" type="email" containerClassName="mb-2" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
          {emailMsg && <p className="text-m3-body-medium text-md-on-primary-container mb-2">{emailMsg}</p>}
          <MdButton variant="filled" disabled={emailSubmitting} onClick={setEmail}>
            設定する
          </MdButton>
        </div>
      )}

      <div className="text-center mt-6">
        <Link href="/account/security" className="text-m3-body-medium text-md-on-surface-variant">セキュリティに戻る</Link>
      </div>
    </MdAccountCard>
  );
}
