"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { decR } from "@/lib/auth/utils";
import { genOTP, is2FA, saveOTP, sendOTP, tryBackup, verifyOTP, clearOTP } from "@/lib/auth/otp";
import { logAct, regSession } from "@/lib/auth/session";
import OtpPanel from "@/components/OtpPanel";

const GOOGLE_CLIENT_ID = "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";
const CONSENT_INTERVAL = 30 * 24 * 60 * 60 * 1000;

function afterLoginRedirect(r: string | null) {
  const dest = (r ? decR(r) : null) || "/account/settings";
  window.location.replace(dest);
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const r = searchParams.get("r");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [googleError, setGoogleError] = useState("");
  const [show2fa, setShow2fa] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ email: string; pass: string } | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) afterLoginRedirect(r);
    });
    return unsub;
  }, [r]);

  useEffect(() => {
    if (sessionStorage.getItem("ll_redirect_login")) {
      sessionStorage.removeItem("ll_redirect_login");
      (async () => {
        try {
          const auth = getFirebaseAuth();
          const db = getFirebaseDb();
          const res = await getRedirectResult(auth);
          if (res?.user) {
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await afterLogin(res.user.uid, "Google", res.user, db);
          }
        } catch (e) {
          setGoogleError(e instanceof Error ? e.message : String(e));
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function afterLogin(uid: string, method: string, user: Parameters<typeof regSession>[0], db: ReturnType<typeof getFirebaseDb>) {
    await regSession(user, db);
    await logAct(uid, db, "login", method);
    afterLoginRedirect(r);
  }

  const doGoogle = async () => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    const p = new GoogleAuthProvider();
    const last = localStorage.getItem("ll_last_consent");
    p.setCustomParameters({
      prompt: !last || Date.now() - parseInt(last) > CONSENT_INTERVAL ? "consent" : "select_account",
    });
    try {
      const res = await signInWithPopup(auth, p);
      localStorage.setItem("ll_last_consent", Date.now().toString());
      await afterLogin(res.user.uid, "Google", res.user, db);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/popup-blocked") {
        sessionStorage.setItem("ll_redirect_login", "1");
        await signInWithRedirect(auth, p);
      } else {
        setGoogleError(e instanceof Error ? e.message : String(e));
      }
    }
  };

  useEffect(() => {
    const w = window as unknown as {
      google?: { accounts?: { id?: { initialize: (opts: unknown) => void; prompt: () => void } } };
    };
    const initOneTap = () => {
      if (!w.google?.accounts?.id) return;
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (credentialResponse: { credential: string }) => {
          try {
            const auth = getFirebaseAuth();
            const db = getFirebaseDb();
            const credential = GoogleAuthProvider.credential(credentialResponse.credential);
            const result = await signInWithCredential(auth, credential);
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await afterLogin(result.user.uid, "Google OneTap", result.user, db);
          } catch (e) {
            setGoogleError(e instanceof Error ? e.message : String(e));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      w.google.accounts.id.prompt();
    };
    if (w.google?.accounts?.id) initOneTap();
    else window.addEventListener("load", initOneTap, { once: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doEmail = async () => {
    if (!email || !password) {
      setLoginMsg({ text: "メールアドレスとパスワードを入力してください", type: "error" });
      return;
    }
    setSubmitting(true);
    setLoginMsg({ text: "", type: "" });
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const enabled = await is2FA(cred.user.uid, db);
      if (enabled && cred.user.email) {
        const code = genOTP();
        await saveOTP(cred.user.uid, db, code, "login_verify");
        await sendOTP(cred.user, code, "ログイン認証");
        await auth.signOut();
        setPending({ email, pass: password });
        setLoginMsg({ text: `📧 ${cred.user.email} に認証コードを送信しました`, type: "success" });
        setShow2fa(true);
        setSubmitting(false);
        return;
      }
      await afterLogin(cred.user.uid, "メール", cred.user, db);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const M: Record<string, string> = {
        "auth/user-not-found": "登録されていません",
        "auth/wrong-password": "パスワードが間違っています",
        "auth/invalid-credential": "メールまたはパスワードが間違っています",
        "auth/too-many-requests": "しばらく後に再試行してください",
      };
      setLoginMsg({ text: (code && M[code]) || (e instanceof Error ? e.message : String(e)), type: "error" });
      setSubmitting(false);
    }
  };

  const handle2faVerify = async (input: string, isBackup: boolean) => {
    if (!pending) return { ok: false, reason: "セッションが失われました" };
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    let cred2;
    try {
      cred2 = await signInWithEmailAndPassword(auth, pending.email, pending.pass);
    } catch {
      return { ok: false, reason: "再認証に失敗しました" };
    }
    if (isBackup) {
      const res = await tryBackup(cred2.user.uid, db, input);
      if (!res.ok) {
        await auth.signOut();
        return res;
      }
    } else {
      const res = await verifyOTP(cred2.user.uid, db, input, "login_verify");
      if (!res.ok) {
        await auth.signOut();
        return res;
      }
      await clearOTP(cred2.user.uid, db);
    }
    setPending(null);
    await afterLogin(cred2.user.uid, "メール+2FA", cred2.user, db);
    return { ok: true };
  };

  const doForgotPassword = async () => {
    if (!email) {
      setLoginMsg({ text: "メールアドレスを入力してください", type: "error" });
      return;
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      setLoginMsg({ text: "✅ リセットメールを送信しました。迷惑メールフォルダもご確認ください。", type: "success" });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      setLoginMsg({
        text: code === "auth/user-not-found" ? "登録されていません" : e instanceof Error ? e.message : String(e),
        type: "error",
      });
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
        <h1 className="text-2xl font-bold text-center mb-1.5">ログイン</h1>
        <p className="text-center text-sm text-gray-500 mb-6">legal&life アカウントにログイン</p>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
          onClick={doGoogle}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.43-8.71l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Googleでログイン
        </button>
        {googleError && <p className="text-red-600 text-sm mt-2">{googleError}</p>}

        <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
          <span className="flex-1 h-px bg-gray-200" />
          または
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        {!show2fa && (
          <div>
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="login-email">メールアドレス</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="login-password">パスワード</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doEmail()}
              />
            </div>
            {loginMsg.text && (
              <p className={`text-sm mb-2 ${loginMsg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {loginMsg.text}
              </p>
            )}
            <button
              type="button"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
              disabled={submitting}
              onClick={doEmail}
            >
              ログイン
            </button>
            <div className="text-center mt-3">
              <button type="button" className="text-sm text-gray-500 underline" onClick={doForgotPassword}>
                パスワードをお忘れの方
              </button>
            </div>
          </div>
        )}

        {show2fa && (
          <OtpPanel
            title="二段階認証"
            desc="メールに送信された6桁のコードを入力してください"
            showBackup
            onVerify={handle2faVerify}
            onCancel={() => {
              setPending(null);
              setShow2fa(false);
              router.refresh();
            }}
          />
        )}

        <div className="h-px bg-gray-200 my-5" />
        <div className="text-center">
          <Link href="/account/signup" className="text-sm text-primary-dark font-semibold">アカウントをお持ちでない方</Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/" className="text-sm text-gray-400">ホームへ戻る</Link>
        </div>
    </div>
  );
}
