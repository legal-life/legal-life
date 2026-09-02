"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { logAct } from "@/lib/auth/session";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import { IconCheck, IconTrash } from "@/components/icons";

type TotpFactor = { id: string; friendly_name?: string; created_at: string };

export default function TwoFaPage() {
  const [user, setUser] = useState<User | null>(null);
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
    (async () => {
      const u = await requireAuth();
      setUser(u);
      await refresh();
    })();
  }, []);

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

  if (!user || factors === null) return null;

  const enabled = factors.length > 0;

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/security" className="text-sm text-gray-500">← セキュリティに戻る</Link>
      <h1 className="text-xl font-bold mt-3 mb-1">二段階認証</h1>
      <p className="text-sm text-gray-500 mb-5">認証アプリ(Google Authenticator等)を使ってアカウントのセキュリティを強化</p>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
        <div>
          <p className="font-bold text-sm">二段階認証</p>
          <p className={`text-xs mt-1 ${enabled ? "text-[#27ae60]" : "text-gray-500"}`}>{enabled ? "有効" : "無効"}</p>
        </div>
      </div>

      {!enrolling ? (
        <>
          {justEnabled && (
            <div className="bg-[#f0fbfe] border border-primary/60 rounded-xl p-4 mb-4">
              <p className="font-bold text-sm mb-1 flex items-center gap-1.5">
                <IconCheck className="w-4 h-4 shrink-0" /> 二段階認証を有効にしました!
              </p>
              <p className="text-xs text-gray-600">
                機種変更やスマホの紛失に備えて、別の端末でもう1台認証アプリを登録しておくことをお勧めします。
              </p>
            </div>
          )}

          {factors.length > 0 && (
            <div className="space-y-2 mb-4">
              {factors.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{f.friendly_name || "認証アプリ"}</p>
                    <p className="text-xs text-gray-500">
                      登録日: {new Date(f.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[#e74c3c] p-1.5 hover:bg-[#fff5f5] rounded-md"
                    onClick={() => removeFactor(f.id)}
                    aria-label="削除"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            有効にすると、ログイン時に認証アプリが生成する6桁のコードが必要になります。
          </p>

          {error && <p className="text-sm text-[#e74c3c] mb-3">{error}</p>}
          <button
            type="button"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm"
            onClick={startEnroll}
          >
            {factors.length > 0 ? "認証アプリを追加登録する" : "二段階認証を有効にする"}
          </button>
        </>
      ) : (
        <div>
          <p className="text-sm mb-3">認証アプリ(Google Authenticator、1Password等)でQRコードを読み取ってください。</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QRコード" className="mx-auto mb-3 w-40 h-40" />}
          <p className="text-xs text-gray-500 mb-3 break-all">
            読み取れない場合はこのコードを手入力: <span className="font-mono">{secret}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            className="w-full border-2 border-[#e0e0e0] rounded-[10px] py-3 text-2xl font-bold text-center tracking-[10px] outline-none mb-3 focus:border-primary"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmEnroll()}
          />
          {error && <p className="text-sm text-[#e74c3c] mb-3">{error}</p>}
          <div className="flex gap-2.5">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-lg border-[1.5px] border-[#ddd] bg-white text-[#555] font-bold text-sm hover:bg-[#f5f5f5]"
              onClick={cancelEnroll}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="flex-[2] py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark disabled:opacity-60"
              disabled={submitting || code.length !== 6}
              onClick={confirmEnroll}
            >
              {submitting ? "確認中..." : "確認する"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link href="/account/security" className="text-sm text-gray-500">セキュリティに戻る</Link>
      </div>
    </div>
  );
}
