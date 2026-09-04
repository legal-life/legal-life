"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { decR, generateNonce } from "@/lib/auth/utils";
import { needsMfaChallenge, challengeAndVerifyFirstFactor } from "@/lib/auth/mfa";
import { logAct, regSession } from "@/lib/auth/session";
import { sendNoticeForUser } from "@/lib/auth/notifications";
import { signInWithPasskey } from "@/lib/auth/passkey";
import { IconGoogleLogo, IconLock } from "@/components/icons";
import OtpPanel from "@/components/OtpPanel";
import Captcha, { isCaptchaEnabled, type CaptchaHandle } from "@/components/Captcha";
import MdAccountCard from "@/components/material/MdAccountCard";
import MdButton from "@/components/material/MdButton";
import MdTextField from "@/components/material/MdTextField";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";
const CONSENT_INTERVAL = 30 * 24 * 60 * 60 * 1000;

// decR は "/" で始まる文字列であれば許可するが、"//evil.com" のようなプロトコル
// 相対URL(スキームなしの絶対URL)も "/" で始まるため素通りしてしまい、
// ログイン後に外部サイトへリダイレクトされるオープンリダイレクト脆弱性になり得る。
// そのため同一オリジンの相対パス("/xxx" で始まり "//" や "/\" で始まらない)
// であることをここで追加検証する。
function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}

function afterLoginRedirect(r: string | null) {
  const decoded = r ? decR(r) : null;
  const dest = decoded && isSafeRedirectPath(decoded) ? decoded : "/account";
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
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);
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
    // r はBase64文字列(encR由来)で "+" "/" "=" を含み得るため、クエリ文字列に
    // そのまま埋め込むと "+" が空白として再解釈される等でGoogle OAuth往復後に
    // decR()が壊れた値を受け取ってしまう。encodeURIComponentで再エンコードする。
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/account/login${r ? `?r=${encodeURIComponent(r)}` : ""}` },
    });
    if (error) setGoogleError(error.message);
  };

  const doPasskey = async () => {
    setPasskeySubmitting(true);
    setPasskeyError("");
    try {
      const { data, error } = await signInWithPasskey();
      if (error || !data.user) throw error || new Error("ログインに失敗しました");
      await proceedOrChallenge(data.user, "パスキー");
    } catch (e) {
      setPasskeyError(e instanceof Error ? e.message : String(e));
    } finally {
      setPasskeySubmitting(false);
    }
  };

  useEffect(() => {
    const w = window as unknown as {
      google?: { accounts?: { id?: { initialize: (opts: unknown) => void; prompt: () => void } } };
    };
    const initOneTap = async () => {
      if (!w.google?.accounts?.id) return;
      const [nonce, hashedNonce] = await generateNonce();
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (credentialResponse: { credential: string }) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: credentialResponse.credential,
              nonce,
            });
            if (error || !data.user) throw error || new Error("ログインに失敗しました");
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await proceedOrChallenge(data.user, "Google OneTap");
          } catch (e) {
            setGoogleError(e instanceof Error ? e.message : String(e));
          }
        },
        nonce: hashedNonce,
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
    <div className="w-full max-w-[520px] rounded-m3-lg bg-md-surface-container-lowest p-9 shadow-m3-1">
        <h1 className="text-center text-m3-headline-medium text-md-on-surface mb-1.5">ログイン</h1>
        <p className="text-center text-m3-body-medium text-md-on-surface-variant mb-6">legal&life アカウントにログイン</p>

        <MdButton id="auth-google-btn" variant="outlined" className="w-full" onClick={doGoogle}>
          <IconGoogleLogo className="w-[18px] h-[18px]" />
          Googleでログイン
        </MdButton>
        {googleError && <p className="text-m3-body-small text-md-error mt-2">{googleError}</p>}

        <MdButton
          id="auth-passkey-btn"
          variant="outlined"
          className="w-full mt-2.5"
          disabled={passkeySubmitting}
          onClick={doPasskey}
        >
          <IconLock className="w-[18px] h-[18px]" />
          {passkeySubmitting ? "確認中..." : "パスキーでログイン"}
        </MdButton>
        {passkeyError && <p className="text-m3-body-small text-md-error mt-2">{passkeyError}</p>}

        <div className="flex items-center gap-3 my-5 text-m3-body-small text-md-on-surface-variant">
          <span className="flex-1 h-px bg-md-outline-variant" />
          または
          <span className="flex-1 h-px bg-md-outline-variant" />
        </div>

        {!show2fa && (
          <div>
            <MdTextField
              id="login-email"
              label="メールアドレス"
              type="email"
              autoComplete="email"
              containerClassName="mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <MdTextField
              id="login-password"
              label="パスワード"
              type="password"
              autoComplete="current-password"
              containerClassName="mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doEmail()}
            />
            <Captcha ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
            {loginMsg.text && (
              <p className={`text-m3-body-small mb-2 ${loginMsg.type === "error" ? "text-md-error" : "text-[#146c2e]"}`}>
                {loginMsg.text}
              </p>
            )}
            <MdButton
              id="auth-submit-btn"
              variant="filled"
              className="w-full"
              disabled={submitting || (isCaptchaEnabled() && !captchaToken)}
              onClick={doEmail}
            >
              ログイン
            </MdButton>
            <div className="text-center mt-3">
              <button type="button" className="text-m3-body-medium text-md-on-surface-variant underline" onClick={doForgotPassword}>
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

        <div className="h-px bg-md-outline-variant my-5" />
        <div className="text-center">
          <Link href="/account/signup" className="text-m3-body-medium text-md-primary font-medium">アカウントをお持ちでない方</Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/" className="text-m3-body-small text-md-on-surface-variant">ホームへ戻る</Link>
        </div>
    </div>
  );
}
