"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { decR, generateNonce, validatePassword } from "@/lib/auth/utils";
import { logAct } from "@/lib/auth/session";
import Captcha, { isCaptchaEnabled, type CaptchaHandle } from "@/components/Captcha";
import { IconGoogleLogo } from "@/components/icons";
import MdButton from "@/components/material/MdButton";
import MdTextField from "@/components/material/MdTextField";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";

// decR は "/" で始まる文字列であれば許可するが、"//evil.com" のようなプロトコル
// 相対URL(スキームなしの絶対URL)も "/" で始まるため素通りしてしまい、
// 登録後に外部サイトへリダイレクトされるオープンリダイレクト脆弱性になり得る。
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
    const pwError = validatePassword(password);
    if (pwError) return setMsg({ text: pwError, type: "error" });
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
        weak_password: "8文字以上で、大文字・小文字・数字・記号を含めてください",
      };
      setMsg({ text: (code && M[code]) || (e instanceof Error ? e.message : String(e)), type: "error" });
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] rounded-m3-lg bg-md-surface-container-lowest p-9 shadow-m3-1">
        <h1 className="text-center text-m3-headline-medium text-md-on-surface mb-1.5">アカウントを作成</h1>
        <p className="text-center text-m3-body-medium text-md-on-surface-variant mb-6">legal&life に参加する</p>

        <MdButton variant="outlined" className="w-full" onClick={doGoogle}>
          <IconGoogleLogo className="w-[18px] h-[18px]" />
          Googleで登録
        </MdButton>
        {googleError && <p className="text-m3-body-small text-md-error mt-2">{googleError}</p>}

        <div className="flex items-center gap-3 my-5 text-m3-body-small text-md-on-surface-variant">
          <span className="flex-1 h-px bg-md-outline-variant" />
          または
          <span className="flex-1 h-px bg-md-outline-variant" />
        </div>

        <MdTextField
          id="signup-name"
          label="お名前"
          type="text"
          autoComplete="name"
          containerClassName="mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <MdTextField
          id="signup-email"
          label="メールアドレス"
          type="email"
          autoComplete="email"
          containerClassName="mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <MdTextField
          id="signup-password"
          label="パスワード(8文字以上、大文字・小文字・数字・記号を含む)"
          type="password"
          autoComplete="new-password"
          containerClassName="mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <MdTextField
          id="signup-password-confirm"
          label="パスワード(確認)"
          type="password"
          autoComplete="new-password"
          containerClassName="mb-3"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSubmit()}
        />
        <p className="text-m3-body-small text-md-on-surface-variant mb-3 leading-relaxed">
          登録することで <Link href="/law/terms" className="text-md-primary">利用規約</Link> および{" "}
          <Link href="/law/privacy" className="text-md-primary">プライバシーポリシー</Link> に同意したものとみなされます。
        </p>
        <Captcha ref={captchaRef} onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        {msg.text && (
          <p className={`text-m3-body-small mb-2 ${msg.type === "error" ? "text-md-error" : "text-[#146c2e]"}`}>{msg.text}</p>
        )}
        <MdButton
          variant="filled"
          className="w-full"
          disabled={submitting || (isCaptchaEnabled() && !captchaToken)}
          onClick={doSubmit}
        >
          作成する
        </MdButton>

        <div className="text-center mt-5">
          <Link href="/account/login" className="text-m3-body-medium text-md-primary font-medium">すでにアカウントをお持ちの方</Link>
        </div>
        <div className="text-center mt-2">
          <Link href="/" className="text-m3-body-small text-md-on-surface-variant">ホームへ戻る</Link>
        </div>
    </div>
  );
}
