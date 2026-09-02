"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { decR, generateNonce } from "@/lib/auth/utils";
import { logAct } from "@/lib/auth/session";
import Captcha, { isCaptchaEnabled, type CaptchaHandle } from "@/components/Captcha";
import { IconGoogleLogo } from "@/components/icons";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";

function afterLoginRedirect(r: string | null) {
  const dest = (r ? decR(r) : null) || "/account/settings";
  window.location.replace(dest);
}

export default function SignupForm() {
  const searchParams = useSearchParams();
  const r = searchParams.get("r");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [googleError, setGoogleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<CaptchaHandle>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) afterLoginRedirect(r);
    });
    return () => subscription.unsubscribe();
  }, [r]);

  const doGoogle = async () => {
    localStorage.setItem("ll_last_consent", Date.now().toString());
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/account/signup${r ? `?r=${r}` : ""}` },
    });
    if (error) setGoogleError(error.message);
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
            if (error || !data.user) throw error || new Error("登録に失敗しました");
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await logAct(data.user.id, "signup", "Google OneTap");
            afterLoginRedirect(r);
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

  const doSubmit = async () => {
    if (!name) return setMsg({ text: "お名前を入力してください", type: "error" });
    if (!email) return setMsg({ text: "メールアドレスを入力してください", type: "error" });
    if (password.length < 6) return setMsg({ text: "パスワードは6文字以上", type: "error" });
    if (password !== confirm) return setMsg({ text: "パスワードが一致しません", type: "error" });
    if (isCaptchaEnabled() && !captchaToken) return setMsg({ text: "認証(CAPTCHA)を完了してください", type: "error" });

    setSubmitting(true);
    setMsg({ text: "", type: "" });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${location.origin}/welcome`,
          captchaToken,
        },
      });
      captchaRef.current?.reset();
      setCaptchaToken("");
      if (error || !data.user) throw error || new Error("登録に失敗しました");
      await logAct(data.user.id, "signup", "メール");
      if (!data.session) {
        setMsg({ text: "確認メールを送信しました。メール内のリンクから登録を完了してください。", type: "success" });
        setSubmitting(false);
        return;
      }
      afterLoginRedirect(r);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const M: Record<string, string> = {
        user_already_exists: "すでに使用済みです",
        email_address_invalid: "形式が正しくありません",
        weak_password: "6文字以上にしてください",
      };
      setMsg({ text: (code && M[code]) || (e instanceof Error ? e.message : String(e)), type: "error" });
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white border border-[#dadce0] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-9">
        <h1 className="text-2xl font-bold text-center mb-1.5">アカウントを作成</h1>
        <p className="text-center text-sm text-gray-500 mb-6">legal&life に参加する</p>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
          onClick={doGoogle}
        >
          <IconGoogleLogo className="w-[18px] h-[18px]" />
          Googleで登録
        </button>
        {googleError && <p className="text-[#e74c3c] text-sm mt-2">{googleError}</p>}

        <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
          <span className="flex-1 h-px bg-gray-200" />
          または
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="signup-name">お名前</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="氏名またはニックネーム"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="signup-email">メールアドレス</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="signup-password">パスワード</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="6文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-xs font-bold text-gray-600 mb-1" htmlFor="signup-password-confirm">パスワード（確認）</label>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="もう一度入力"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSubmit()}
          />
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          登録することで <Link href="/law/terms" className="text-primary-dark">利用規約</Link> および{" "}
          <Link href="/law/privacy" className="text-primary-dark">プライバシーポリシー</Link> に同意したものとみなされます。
        </p>
        <Captcha ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        {msg.text && (
          <p className={`text-sm mb-2 ${msg.type === "error" ? "text-[#e74c3c]" : "text-[#27ae60]"}`}>{msg.text}</p>
        )}
        <button
          type="button"
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
          disabled={submitting || (isCaptchaEnabled() && !captchaToken)}
          onClick={doSubmit}
        >
          作成する
        </button>

        <div className="text-center mt-5">
          <Link href="/account/login" className="text-sm text-primary-dark font-semibold">すでにアカウントをお持ちの方</Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/" className="text-sm text-gray-400">ホームへ戻る</Link>
        </div>
    </div>
  );
}
