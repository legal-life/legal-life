import { NextRequest, NextResponse } from "next/server";
import {
  buildContactHTML,
  buildNoticeHTML,
  buildSubject,
  DEVICE_INFO_KEYS,
  sendMail,
  type ContactMailParams,
} from "@/lib/mail/gmail";
import { supabase } from "@/lib/supabase/client";

// お問い合わせフォームは未認証で誰でも呼べるため、各フィールドの長さに上限を
// 設けないと、巨大なペイロードによるDB肥大化・巨大メール送信・スパムに対して
// 無防備になる。フロント側(ContactForm.tsx)にも一部制限はあるが、
// APIを直接叩かれるケースに備えてサーバー側でも必ず検証する。
const MAX_LENGTHS: Record<string, number> = {
  from_name: 100,
  reply_email: 254,
  gender: 50,
  age_group: 50,
  inquiry_type: 100,
  category: 100,
  content: 5000,
};

// notice(会員向け通知)側にはcontactと違いフィールド長の上限がなく、認証済みユーザーであれば
// 誰でも呼べてしまうため、巨大なpurpose/to_name等を送りつけて肥大化したメールを大量生成
// させることができてしまう。to_email自体は正規の呼び出し元(email_change等)で任意の宛先
// (変更先の未確認メールアドレス)になり得るため制限できないが、各フィールドの長さは制限する。
const NOTICE_MAX_LENGTHS: Record<string, number> = {
  to_email: 254,
  to_name: 100,
  purpose: 300,
};

// フィールドが文字列型でない場合(配列・オブジェクト等)、これまでは長さチェックを
// 素通りしてしまい、MAX_LENGTHS/NOTICE_MAX_LENGTHSが本来防ぐはずの巨大ペイロード
// (ネストしたJSONオブジェクト等、文字列のlengthでは測れない値)をDB保存・メール本文への
// 埋め込みに使えてしまっていた。存在する値は文字列型であることも合わせて要求する。
function findInvalidField(params: Record<string, unknown>, limits: Record<string, number>): string | null {
  for (const [field, max] of Object.entries(limits)) {
    const value = params[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string" || value.length > max) return field;
  }
  return null;
}

// notice送信は認証済みユーザーなら誰でも呼べ、Bearer検証(Round1)は「未ログインの第三者」
// からの乱用しか防げない。to_emailは正規のユースケース(メールアドレス変更確認等)で
// 呼び出し元ユーザー自身のアドレスと一致しないことがあるため宛先を本人メールに固定できず、
// 制限なしだと本サイトのGmailアカウントを使って認証済みユーザーが任意の第三者へ大量の
// メールを送りつける踏み台(スパム/なりすまし)に悪用され得る。ユーザーID単位の
// インメモリ・スライディングウィンドウで送信頻度を抑える(chat/route.tsのIP制限と同様、
// サーバーレスの複数インスタンスでは完全な防御にはならないが最低限の抑止力とする)。
const NOTICE_RATE_LIMIT_WINDOW_MS = 5 * 60_000;
const NOTICE_RATE_LIMIT_MAX_REQUESTS = 5;
const noticeRequestTimestamps = new Map<string, number[]>();

function isNoticeRateLimited(uid: string): boolean {
  const now = Date.now();
  const timestamps = (noticeRequestTimestamps.get(uid) || []).filter(
    (t) => now - t < NOTICE_RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= NOTICE_RATE_LIMIT_MAX_REQUESTS) {
    noticeRequestTimestamps.set(uid, timestamps);
    return true;
  }
  timestamps.push(now);
  noticeRequestTimestamps.set(uid, timestamps);
  return false;
}

// メール送信API。旧 legal-life-mailer (Cloudflare Workers) の api/index.js を統合したもの。
// 送信はGmail SMTP(Nodemailer)経由。第三者ESP(Resend等)はgmail.com等の共有ドメインを
// 送信元として認証できないため、独自ドメインなしでGmailアドレスから送るにはこの方式のみ。

// Cloudflare Turnstileでの検証(TURNSTILE_SECRET_KEY未設定時は既存動作のまま何もしない=
// 後方互換)。お問い合わせフォームは未認証で誰でも呼べるため、スパム・大量投稿対策として使う。
async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type as string | undefined;
  if (!type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    if (type === "contact") {
      const params = body as unknown as ContactMailParams & { captchaToken?: string };
      if (
        typeof params.from_name !== "string" ||
        !params.from_name ||
        typeof params.inquiry_type !== "string" ||
        !params.inquiry_type ||
        typeof params.content !== "string" ||
        !params.content
      ) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      const invalidField = findInvalidField(params as unknown as Record<string, unknown>, MAX_LENGTHS);
      if (invalidField) {
        return NextResponse.json(
          { error: `${invalidField}が不正です(最大${MAX_LENGTHS[invalidField]}文字の文字列)` },
          { status: 400 },
        );
      }
      if (!(await verifyCaptcha(params.captchaToken))) {
        return NextResponse.json({ error: "CAPTCHA検証に失敗しました" }, { status: 400 });
      }

      // お問い合わせの保存を主経路とする。メール送信(Gmail SMTP)は現状不安定なため、
      // 送信に失敗してもSupabaseへの保存が成功していれば管理画面から確認できるようにする。
      const { from_name, gender, age_group, reply_email, inquiry_type, category, content } = params;
      // device_infoは未認証で誰でも送れる値のため、既知のキーのみを許可リストで
      // 取り込み(任意のキーを無制限にJSONBへ書き込ませない)、各値も長さを制限する。
      const MAX_DEVICE_FIELD_LEN = 500;
      const deviceInfo = Object.fromEntries(
        DEVICE_INFO_KEYS.filter((key) => typeof params[key] === "string").map((key) => [
          key,
          (params[key] as string).slice(0, MAX_DEVICE_FIELD_LEN),
        ]),
      );
      const { error: insertError } = await supabase.from("contact_inquiries").insert({
        from_name,
        gender,
        age_group,
        reply_email,
        inquiry_type,
        category,
        content,
        device_info: deviceInfo,
      });
      if (insertError) {
        console.error("Failed to save contact inquiry to Supabase:", insertError);
        return NextResponse.json(
          { error: "Failed to save inquiry", detail: insertError.message },
          { status: 500 },
        );
      }

      const contactTo = process.env.CONTACT_TO_EMAIL;
      if (contactTo) {
        try {
          await sendMail({
            to: contactTo,
            subject: buildSubject("contact", params.inquiry_type),
            html: buildContactHTML(params),
          });
        } catch (mailErr) {
          console.error("Contact notification mail failed (inquiry was saved):", mailErr);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // notice: 会員向け通知メール。任意の宛先へメールを送れてしまう不正中継(オープンリレー)を
    // 防ぐため、認証済みユーザーのリクエストのみを受け付ける(送信元アドレス自体は限定しないが、
    // 未ログインの第三者が任意の宛先へ本サイトのGmailアカウントから送信することを防止する)。
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (isNoticeRateLimited(authData.user.id)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 },
      );
    }

    const to_email = body.to_email;
    if (typeof to_email !== "string" || !to_email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const invalidNoticeField = findInvalidField(body, NOTICE_MAX_LENGTHS);
    if (invalidNoticeField) {
      return NextResponse.json(
        { error: `${invalidNoticeField}が不正です(最大${NOTICE_MAX_LENGTHS[invalidNoticeField]}文字の文字列)` },
        { status: 400 },
      );
    }

    const purpose = body.purpose as string | undefined;
    const html = buildNoticeHTML({ to_name: body.to_name as string | undefined, purpose });

    await sendMail({ to: to_email, subject: buildSubject("notice", purpose), html });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mail delivery failed:", err);
    return NextResponse.json(
      { error: "Mail delivery failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
