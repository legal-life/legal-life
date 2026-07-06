"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { signOut, type User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { requireAuth } from "@/lib/auth/requireAuth";
import { delSession, logAct } from "@/lib/auth/session";
import { genOTP, is2FA, saveOTP, sendOTP, verifyOTP, clearOTP } from "@/lib/auth/otp";
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
  const [msg, setMsg] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    (async () => {
      const u = await requireAuth();
      setUser(u);
      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, "users", u.uid)).catch(() => null);
      if (snap?.exists() && snap.data().deletionPending) {
        setAlreadyPending(true);
        const d = snap.data().scheduledDeletion?.toDate?.();
        if (d) setScheduledDate(d.toLocaleString("ja-JP"));
      }
    })();
  }, []);

  const execDelete = async () => {
    if (!user) return;
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    await setDoc(
      doc(db, "users", user.uid),
      {
        deletionPending: true,
        scheduledDeletion: Timestamp.fromMillis(Date.now() + 30 * 86400000),
        deletionRequestAt: serverTimestamp(),
      },
      { merge: true },
    );
    await logAct(user.uid, db, "deletion_request", "30日後削除予定");
    await delSession(user, db);
    await signOut(auth);
    sessionStorage.removeItem("ll_auth_cache");
    setSuccess(true);
  };

  const handleCancelPending = async () => {
    if (!user) return;
    const db = getFirebaseDb();
    try {
      await setDoc(doc(db, "users", user.uid), { deletionPending: false, scheduledDeletion: null }, { merge: true });
      setCancelMsg("✅ 削除申請をキャンセルしました");
      setTimeout(() => window.location.replace("/account/settings"), 1500);
    } catch (e) {
      setCancelMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const handleExecute = async () => {
    if (!user) return;
    setSubmitting(true);
    const db = getFirebaseDb();
    const enabled = await is2FA(user.uid, db);
    if (enabled && user.email) {
      const code = genOTP();
      await saveOTP(user.uid, db, code, "account_delete");
      await sendOTP(user, code, "アカウント削除申請");
      setMsg(`📧 ${user.email} に認証コードを送信しました`);
      setShowOtp(true);
      return;
    }
    await execDelete();
  };

  const handleOtpVerify = async (input: string) => {
    if (!user) return { ok: false, reason: "ユーザー情報がありません" };
    const db = getFirebaseDb();
    const res = await verifyOTP(user.uid, db, input, "account_delete");
    if (!res.ok) {
      setSubmitting(false);
      return res;
    }
    await clearOTP(user.uid, db);
    await execDelete();
    return { ok: true };
  };

  if (!user) return null;

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <p className="font-bold mb-2">削除申請済みです</p>
          <p className="text-sm mb-2">削除予定日: <strong>{scheduledDate || "--"}</strong></p>
          <p className="text-xs text-amber-700 mb-4">予定日まで、アカウントの利用は一部制限されます。</p>
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
    <div className="max-w-md mx-auto px-4 py-10">
      <Link href="/account/settings" className="text-sm text-gray-500">← アカウント設定に戻る</Link>
      <h1 className="text-xl font-bold mt-3">アカウントの削除</h1>
      <p className="text-sm text-gray-500 mb-5">削除申請後、30日間はキャンセル可能です</p>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
        <p className="font-bold text-sm mb-1">削除前に必ずご確認ください</p>
        <p className="text-xs text-red-700">削除申請から30日後にすべてのデータが完全削除されます。この操作は取り消せません。</p>
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

      {msg && <p className="text-sm mb-2">{msg}</p>}
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
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
          disabled={!checked.every(Boolean) || submitting}
          onClick={handleExecute}
        >
          削除を申請する
        </button>
      )}
    </div>
  );
}
