import { NextRequest, NextResponse } from "next/server";
import {
  buildContactHTML,
  buildNoticeHTML,
  buildOtpHTML,
  buildSubject,
  sendMail,
  type ContactMailParams,
} from "@/lib/mail/gmail";
import { supabase } from "@/lib/supabase/client";

// メール送信API。旧 legal-life-mailer (Cloudflare Workers) の api/index.js を統合したもの。
// 送信はGmail SMTP(Nodemailer)経由。第三者ESP(Resend等)はgmail.com等の共有ドメインを
// 送信元として認証できないため、独自ドメインなしでGmailアドレスから送るにはこの方式のみ。
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
      const contactTo = process.env.CONTACT_TO_EMAIL;
      if (!contactTo) throw new Error("CONTACT_TO_EMAIL is not configured");
      const params = body as unknown as ContactMailParams;
      if (!params.from_name || !params.inquiry_type || !params.content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      }
      await sendMail({
        to: contactTo,
        subject: buildSubject("contact", params.inquiry_type),
        html: buildContactHTML(params),
      });

      const { from_name, gender, age_group, reply_email, inquiry_type, category, content, ...deviceInfo } = params;
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
      if (insertError) console.error("Failed to save contact inquiry to Supabase:", insertError);

      return NextResponse.json({ ok: true });
    }

    // otp / notice: 会員向けメール
    const to_email = body.to_email as string | undefined;
    if (!to_email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const purpose = body.purpose as string | undefined;
    const html =
      type === "otp"
        ? buildOtpHTML({
            to_name: body.to_name as string | undefined,
            otp_code: body.otp_code as string | undefined,
            expiry_minutes: body.expiry_minutes as number | undefined,
            purpose,
          })
        : buildNoticeHTML({ to_name: body.to_name as string | undefined, purpose });

    await sendMail({ to: to_email, subject: buildSubject(type as "otp" | "notice", purpose), html });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mail delivery failed:", err);
    return NextResponse.json(
      { error: "Mail delivery failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
