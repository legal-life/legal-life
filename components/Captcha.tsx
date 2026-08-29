"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

// Supabaseダッシュボード側でCAPTCHA保護(Cloudflare Turnstile)を有効化した場合のみ
// NEXT_PUBLIC_TURNSTILE_SITE_KEY を設定する。未設定時はウィジェットごと非表示にし、
// captchaTokenを渡さずに認証APIを呼ぶ(Supabase側の保護が無効なら無視される)。
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function isCaptchaEnabled() {
  return !!SITE_KEY;
}

export type CaptchaHandle = { reset: () => void };

const Captcha = forwardRef<CaptchaHandle, { onVerify: (token: string) => void; onExpire?: () => void }>(
  function Captcha({ onVerify, onExpire }, ref) {
    const widgetRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      reset: () => widgetRef.current?.reset(),
    }));

    if (!SITE_KEY) return null;

    return (
      <div className="my-3 flex justify-center">
        <Turnstile
          ref={widgetRef}
          siteKey={SITE_KEY}
          onSuccess={onVerify}
          onExpire={() => {
            widgetRef.current?.reset();
            onExpire?.();
          }}
        />
      </div>
    );
  },
);

export default Captcha;
