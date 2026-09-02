"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { delSession, logAct } from "@/lib/auth/session";
import { getProfile, setDeletionPending } from "@/lib/auth/profile";
import { hasMFA, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import OtpPanel from "@/components/OtpPanel";

const CHECKS = [
  "削除後、すべてのデータ(チャット履歴・アカウント情報)は完全に消去され復元不可です",
  "削除申請後はコンテンツの利用が制限されます",
  "利用履歴はシステム改善のために匿名化して使用される場合があります",
  "上記をすべて理解し、アカウントの削除を申請します",
];

export default function DeletePage() {
  const [user, setUser] = useState<User | null>(null);
  const [alreadyPending, setAlreadyPending] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => false));
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const profile = await getProfile(u.id);
      if (profile?.deletion_pending) {
        setAlreadyPending(true);
        if (profile.scheduled_deletion) {
          setScheduledDate(new Date(profile.scheduled_deletion).toLocaleString("ja-JP"));
        }
      }
    })();
  }, []);

  const execDelete = async () => {
    if (!user) return;
    await setDeletionPending(user.id, true);
    await logAct(user.id, "deletion_request", "30日後削除予定");
    await sendNoticeForUser(user, "deletion_request", "アカウント削除の申請を受け付けました(30日後に完全削除されます)");
    await delSession(user);
    await supabase.auth.signOut();
    sessionStorage.removeItem("ll_auth_cache");
    setSuccess(true);
  };

  const handleCancelPending = async () => {
    if (!user) return;
    try {
      await setDeletionPending(user.id, false);
      setCancelMsg("削除申請をキャンセルしました");
      setTimeout(() => window.location.replace("/account/settings"), 1500);
    } catch (e) {
      setCancelMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const handleExecute = async () => {
    if (!user) return;
    setSubmitting(true);
    if (await hasMFA()) {
      setShowOtp(true);
      return;
    }
    await execDelete();
  };

  const handleOtpVerify = async (input: string) => {
    if (!user) return { ok: false, reason: "ユーザー情報がありません" };
    const res = await challengeAndVerifyFirstFactor(input);
    if (!res.ok) {
      setSubmitting(false);
      return res;
    }
    await execDelete();
    return { ok: true };
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9 text-center">
        <p className="text-lg font-bold">削除を申請しました</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          30日後に完全削除されます。
          <br />
          キャンセルはアカウント設定ページから可能です。
        </p>
        <Link href="/" className="inline-block mt-5 text-primary-dark font-semibold text-sm">ホームへ戻る</Link>
      </div>
    );
  }

  if (alreadyPending) {
    return (
      <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
        <div className="bg-[#fffdf0] border border-[#ffc107]/70 rounded-xl p-5 text-center">
          <p className="font-bold mb-2">削除申請済みです</p>
          <p className="text-sm mb-2">削除予定日: <strong>{scheduledDate || "--"}</strong></p>
          <p className="text-xs text-[#856404] mb-4">予定日まで、アカウントの利用は一部制限されます。</p>
          <button
            className="bg-primary text-white font-bold rounded-lg py-2.5 px-6 text-sm"
            onClick={handleCancelPending}
          >
            削除申請をキャンセルする
          </button>
          {cancelMsg && <p className="text-sm mt-2">{cancelMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3">アカウントの削除</h1>
      <p className="text-sm text-gray-500 mb-5">削除申請後、30日間はキャンセル可能です</p>

      <div className="bg-[#fff9f9] border border-[#e74c3c]/60 rounded-xl p-4 mb-4">
        <p className="font-bold text-sm mb-1">削除前に必ずご確認ください</p>
        <p className="text-xs text-[#c0392b]">削除申請から30日後にすべてのデータが完全削除されます。この操作は取り消せません。</p>
      </div>

      <div className="space-y-3 mb-4">
        {CHECKS.map((text, i) => (
          <label key={i} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={checked[i]}
              onChange={(e) => {
                const next = [...checked];
                next[i] = e.target.checked;
                setChecked(next);
              }}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>

      {showOtp ? (
        <OtpPanel
          title="本人確認"
          desc="コードを入力してください"
          onVerify={handleOtpVerify}
          onCancel={() => {
            setShowOtp(false);
            setSubmitting(false);
          }}
        />
      ) : (
        <button
          className="w-full bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
          disabled={!checked.every(Boolean) || submitting}
          onClick={handleExecute}
        >
          削除を申請する
        </button>
      )}
    </div>
  );
}
