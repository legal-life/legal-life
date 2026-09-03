import { NextRequest, NextResponse } from "next/server";
import {
  buildContactHTML,
  buildNoticeHTML,
  buildSubject,
  sendMail,
  type ContactMailParams,
} from "@/lib/mail/gmail";
import { supabase } from "@/lib/supabase/client";

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
      if (!params.from_name || !params.inquiry_type || !params.content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      if (!(await verifyCaptcha(params.captchaToken))) {
        return NextResponse.json({ error: "CAPTCHA検証に失敗しました" }, { status: 400 });
      }

      // お問い合わせの保存を主経路とする。メール送信(Gmail SMTP)は現状不安定なため、
      // 送信に失敗してもSupabaseへの保存が成功していれば管理画面から確認できるようにする。
      const { from_name, gender, age_group, reply_email, inquiry_type, category, content, captchaToken: _captchaToken, ...deviceInfo } = params;
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

    const to_email = body.to_email as string | undefined;
    if (!to_email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

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
