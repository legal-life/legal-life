"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { logAct } from "@/lib/auth/session";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import { IconCheck, IconTrash } from "@/components/icons";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";
import MdIconButton from "@/components/material/MdIconButton";
import MdListItem from "@/components/material/MdListItem";
import { useSecurityGate, SecurityGateScreen } from "../SecurityGate";

type TotpFactor = { id: string; friendly_name?: string; created_at: string };

export default function TwoFaPage() {
  const { user, needsGate } = useSecurityGate();
  const [factors, setFactors] = useState<TotpFactor[] | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  };

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  const startEnroll = async () => {
    setError("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) {
      setError(error.message);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(true);
  };

  const confirmEnroll = async () => {
    if (!user) return;
    setSubmitting(true);
    setError("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      setSubmitting(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      setError(verifyError.message);
      setSubmitting(false);
      return;
    }
    await logAct(user.id, "twofa_change", "認証アプリを追加");
    sendNoticeForUser(user, "otp_change", "二段階認証の設定が変更されました(認証アプリを追加)");
    setEnrolling(false);
    setCode("");
    setJustEnabled(true);
    await refresh();
    setSubmitting(false);
  };

  const cancelEnroll = async () => {
    if (factorId) await supabase.auth.mfa.unenroll({ factorId }).catch(() => {});
    setEnrolling(false);
    setFactorId("");
    setCode("");
    setError("");
  };

  const removeFactor = async (id: string) => {
    if (!user || !confirm("この認証アプリを削除しますか?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      alert(error.message);
      return;
    }
    await logAct(user.id, "twofa_change", "認証アプリを削除");
    sendNoticeForUser(user, "otp_change", "二段階認証の設定が変更されました(認証アプリを削除)");
    await refresh();
  };

  if (needsGate) return <SecurityGateScreen title="二段階認証" />;

  if (!user || factors === null) return null;

  const enabled = factors.length > 0;

  return (
    <MdAccountCard
      backHref="/account/security"
      backLabel="セキュリティに戻る"
      title="二段階認証"
      subtitle="認証アプリ(Google Authenticator等)を使ってアカウントのセキュリティを強化"
    >
      <div className="flex items-center justify-between rounded-m3-md bg-md-surface-container p-4 mb-4">
        <div>
          <p className="font-bold text-m3-body-medium text-md-on-surface">二段階認証</p>
          <p className={`text-m3-body-small mt-1 ${enabled ? "text-[#146c2e]" : "text-md-on-surface-variant"}`}>
            {enabled ? "有効" : "無効"}
          </p>
        </div>
      </div>

      {!enrolling ? (
        <>
          {justEnabled && (
            <div className="rounded-m3-md bg-md-primary-container p-4 mb-4">
              <p className="font-bold text-m3-body-medium text-md-on-primary-container mb-1 flex items-center gap-1.5">
                <IconCheck className="w-4 h-4 shrink-0" /> 二段階認証を有効にしました!
              </p>
              <p className="text-m3-body-small text-md-on-primary-container">
                機種変更やスマホの紛失に備えて、別の端末でもう1台認証アプリを登録しておくことをお勧めします。
              </p>
            </div>
          )}

          {factors.length > 0 && (
            <div className="space-y-2 mb-4">
              {factors.map((f) => (
                <MdListItem key={f.id} className="justify-between">
                  <div>
                    <p className="font-semibold text-m3-body-medium text-md-on-surface">{f.friendly_name || "認証アプリ"}</p>
                    <p className="text-m3-body-small text-md-on-surface-variant">
                      登録日: {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <MdIconButton tone="error" onClick={() => removeFactor(f.id)} aria-label="削除">
                    <IconTrash className="w-4 h-4" />
                  </MdIconButton>
                </MdListItem>
              ))}
            </div>
          )}

          <p className="text-m3-body-small text-md-on-surface-variant leading-relaxed mb-4">
            有効にすると、ログイン時に認証アプリが生成する6桁のコードが必要になります。
          </p>

          {error && <p className="text-m3-body-small text-md-error mb-3">{error}</p>}
          <MdButton variant="filled" className="w-full" onClick={startEnroll}>
            {factors.length > 0 ? "認証アプリを追加登録する" : "二段階認証を有効にする"}
          </MdButton>
        </>
      ) : (
        <div>
          <p className="text-m3-body-medium text-md-on-surface mb-3">
            認証アプリ(Google Authenticator、1Password等)でQRコードを読み取ってください。
          </p>
          <div className="rounded-m3-md bg-md-surface-container p-4 mb-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="QRコード" className="w-40 h-40" />}
          </div>
          <p className="text-m3-body-small text-md-on-surface-variant mb-3 break-all">
            読み取れない場合はこのコードを手入力: <span className="font-mono">{secret}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            className="w-full border-2 border-md-outline-variant rounded-m3-sm py-3 text-2xl font-bold text-center tracking-[10px] outline-none mb-3 bg-md-surface-container-lowest text-md-on-surface focus:border-md-primary"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmEnroll()}
          />
          {error && <p className="text-m3-body-small text-md-error mb-3">{error}</p>}
          <div className="flex gap-2.5">
            <MdButton variant="outlined" className="flex-1" onClick={cancelEnroll}>
              キャンセル
            </MdButton>
            <MdButton variant="filled" className="flex-[2]" disabled={submitting || code.length !== 6} onClick={confirmEnroll}>
              {submitting ? "確認中..." : "確認する"}
            </MdButton>
          </div>
        </div>
      )}

      <div className="text-center mt-6">
        <Link href="/account/security" className="text-m3-body-medium text-md-on-surface-variant">セキュリティに戻る</Link>
      </div>
    </MdAccountCard>
  );
}
