"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { logAct } from "@/lib/auth/session";
import { hasMFA, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import { validatePassword } from "@/lib/auth/utils";
import OtpPanel from "@/components/OtpPanel";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";
import MdTextField from "@/components/material/MdTextField";
import { useSecurityGate, SecurityGateScreen } from "../SecurityGate";

export default function PassPage() {
  const { user, needsGate } = useSecurityGate();
  const [hasPassword, setHasPassword] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (!user) return;
    setHasPassword((user.identities ?? []).some((i) => i.provider === "email"));
  }, [user]);

  const execChange = async () => {
    if (!user?.email) throw new Error("メールアドレスが設定されていません");
    try {
      if (hasPassword) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
        if (reauthError) throw new Error("現在のパスワードが間違っています");
      }
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setMsg({ text: "変更しました", type: "success" });
      await logAct(user.id, "password_change", "");
      sendNoticeForUser(user, "password_change", "パスワードが変更されました");
      setHasPassword(true);
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : String(e), type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!newPass) return setMsg({ text: "新しいパスワードを入力してください", type: "error" });
    const pwError = validatePassword(newPass);
    if (pwError) return setMsg({ text: pwError, type: "error" });
    if (newPass !== confirm) return setMsg({ text: "パスワードが一致しません", type: "error" });
    if (hasPassword && !current) return setMsg({ text: "現在のパスワードを入力してください", type: "error" });

    setSubmitting(true);
    setMsg({ text: "", type: "" });
    if (await hasMFA()) {
      setShowOtp(true);
      return;
    }
    await execChange();
  };

  const handleOtpVerify = async (input: string) => {
    const res = await challengeAndVerifyFirstFactor(input);
    if (!res.ok) {
      setSubmitting(false);
      return res;
    }
    await execChange();
    return { ok: true };
  };

  if (needsGate) return <SecurityGateScreen title="パスワード" />;

  if (!user) return null;

  return (
    <MdAccountCard
      backHref="/account/security"
      backLabel="セキュリティに戻る"
      title={hasPassword ? "パスワードを変更する" : "パスワードを設定する"}
      subtitle="安全なパスワードでアカウントを保護しましょう"
    >
      {!showOtp && (
        <div>
          {hasPassword && (
            <MdTextField
              id="current-password"
              label="現在のパスワード"
              type="password"
              autoComplete="current-password"
              containerClassName="mb-4"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          )}
          <MdTextField
            id="new-password"
            label="新しいパスワード(8文字以上、大文字・小文字・数字・記号を含む)"
            type="password"
            autoComplete="new-password"
            containerClassName="mb-4"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <MdTextField
            id="confirm-password"
            label="パスワード(確認)"
            type="password"
            autoComplete="new-password"
            containerClassName="mb-3"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {msg.text && (
            <p className={`text-m3-body-small mb-2 ${msg.type === "error" ? "text-md-error" : "text-[#146c2e]"}`}>{msg.text}</p>
          )}
          <MdButton variant="filled" className="w-full" disabled={submitting} onClick={handleSubmit}>
            {hasPassword ? "パスワードを変更する" : "パスワードを設定する"}
          </MdButton>
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

      <div className="text-center mt-4">
        <Link href="/account/security" className="text-m3-body-medium text-md-on-surface-variant">セキュリティに戻る</Link>
      </div>
    </MdAccountCard>
  );
}
