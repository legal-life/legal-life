"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { decR } from "@/lib/auth/utils";
import { needsMfaChallenge, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import { logAct, regSession } from "@/lib/auth/session";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import { IconGoogleLogo } from "@/components/icons";
import OtpPanel from "@/components/OtpPanel";
import Captcha, { isCaptchaEnabled, type CaptchaHandle } from "@/components/Captcha";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";
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
  const [pending, setPending] = useState<{ user: User; method: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<CaptchaHandle>(null);

  async function afterLogin(user: User, method: string) {
    await regSession(user);
    await logAct(user.id, "login", method);
    sendNoticeForUser(user, "login", "新しいログインがありました"); // 画面遷移をブロックしないよう待たない
    afterLoginRedirect(r);
  }

  // ログイン成功直後に呼ぶ。MFA(TOTP)が有効なユーザーはここでAAL1→AAL2への
  // 追加認証を要求し、不要なユーザーはそのままログイン処理を完了する。
  async function proceedOrChallenge(user: User, method: string) {
    if (await needsMfaChallenge()) {
      setPending({ user, method });
      setShow2fa(true);
      setSubmitting(false);
      return;
    }
    await afterLogin(user, method);
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) proceedOrChallenge(session.user, "Google");
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  const doGoogle = async () => {
    localStorage.setItem("ll_last_consent", Date.now().toString());
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/account/login${r ? `?r=${r}` : ""}` },
    });
    if (error) setGoogleError(error.message);
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
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: credentialResponse.credential,
            });
            if (error || !data.user) throw error || new Error("ログインに失敗しました");
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await proceedOrChallenge(data.user, "Google OneTap");
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
    if (isCaptchaEnabled() && !captchaToken) {
      setLoginMsg({ text: "認証(CAPTCHA)を完了してください", type: "error" });
      return;
    }
    setSubmitting(true);
    setLoginMsg({ text: "", type: "" });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      captchaRef.current?.reset();
      setCaptchaToken("");
      if (error || !data.user) throw error || new Error("ログインに失敗しました");
      await proceedOrChallenge(data.user, "メール");
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const M: Record<string, string> = {
        invalid_credentials: "メールまたはパスワードが間違っています",
        user_not_found: "登録されていません",
        over_request_rate_limit: "しばらく後に再試行してください",
      };
      setLoginMsg({ text: (code && M[code]) || (e instanceof Error ? e.message : String(e)), type: "error" });
      setSubmitting(false);
    }
  };

  const handle2faVerify = async (input: string) => {
    if (!pending) return { ok: false, reason: "セッションが失われました" };
    const res = await challengeAndVerifyFirstFactor(input);
    if (!res.ok) return res;
    const { user, method } = pending;
    setPending(null);
    await afterLogin(user, `${method}+MFA`);
    return { ok: true };
  };

  const doForgotPassword = async () => {
    if (!email) {
      setLoginMsg({ text: "メールアドレスを入力してください", type: "error" });
      return;
    }
    if (isCaptchaEnabled() && !captchaToken) {
      setLoginMsg({ text: "認証(CAPTCHA)を完了してください", type: "error" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/account/security/pass`,
      captchaToken,
    });
    captchaRef.current?.reset();
    setCaptchaToken("");
    if (error) {
      setLoginMsg({ text: error.message, type: "error" });
    } else {
      setLoginMsg({ text: "リセットメールを送信しました。迷惑メールフォルダもご確認ください。", type: "success" });
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
        <h1 className="text-2xl font-bold text-center mb-1.5">ログイン</h1>
        <p className="text-center text-sm text-gray-500 mb-6">legal&life アカウントにログイン</p>

        <button
          id="auth-google-btn"
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
          onClick={doGoogle}
        >
          <IconGoogleLogo className="w-[18px] h-[18px]" />
          Googleでログイン
        </button>
        {googleError && <p className="text-[#e74c3c] text-sm mt-2">{googleError}</p>}

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
            <Captcha ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
            {loginMsg.text && (
              <p className={`text-sm mb-2 ${loginMsg.type === "error" ? "text-[#e74c3c]" : "text-[#27ae60]"}`}>
                {loginMsg.text}
              </p>
            )}
            <button
              id="auth-submit-btn"
              type="button"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
              disabled={submitting || (isCaptchaEnabled() && !captchaToken)}
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
            desc="認証アプリに表示されている6桁のコードを入力してください"
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
