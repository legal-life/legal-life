"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { decR } from "@/lib/auth/utils";
import { logAct } from "@/lib/auth/session";

const GOOGLE_CLIENT_ID = "218375080608-kc02r32e2fjf6vdud3op740udcv5o4e2.apps.googleusercontent.com";

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
            if (error || !data.user) throw error || new Error("登録に失敗しました");
            localStorage.setItem("ll_last_consent", Date.now().toString());
            await logAct(data.user.id, "signup", "Google OneTap");
            afterLoginRedirect(r);
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

  const doSubmit = async () => {
    if (!name) return setMsg({ text: "お名前を入力してください", type: "error" });
    if (!email) return setMsg({ text: "メールアドレスを入力してください", type: "error" });
    if (password.length < 6) return setMsg({ text: "パスワードは6文字以上", type: "error" });
    if (password !== confirm) return setMsg({ text: "パスワードが一致しません", type: "error" });

    setSubmitting(true);
    setMsg({ text: "", type: "" });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${location.origin}/welcome`,
        },
      });
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
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.43-8.71l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
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
        {msg.text && (
          <p className={`text-sm mb-2 ${msg.type === "error" ? "text-[#e74c3c]" : "text-[#27ae60]"}`}>{msg.text}</p>
        )}
        <button
          type="button"
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-lg py-2.5 text-sm transition disabled:opacity-60"
          disabled={submitting}
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
