import { NextRequest, NextResponse } from "next/server";
import {
  buildContactHTML,
  buildNoticeHTML,
  buildOtpHTML,
  buildSubject,
  sendMail,
  type ContactMailParams,
} from "@/lib/mail/resend";

// メール送信API。旧 legal-life-mailer (Cloudflare Workers) の api/index.js を統合したもの。
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
