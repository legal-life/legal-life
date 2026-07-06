export function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export type OtpMailParams = {
  to_name?: string;
  otp_code?: string;
  expiry_minutes?: number;
  purpose?: string;
};

export type MailType = "otp" | "notice" | "contact";

export function buildSubject(type: MailType, purpose?: string): string {
  if (type === "otp") return `【legal&life】認証コード (${purpose || "本人確認"})`;
  if (type === "contact") return `【legal&life】お問い合わせ (${purpose || "お問い合わせ"})`;
  return `【legal&life】${purpose || "重要なお知らせ"}`;
}

function layout(bodyHtml: string): string {
  const siteUrl = process.env.SITE_URL || "https://legal-life.vercel.app";
  const siteLabel = siteUrl.replace(/^https?:\/\//, "");
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;max-width:520px;width:100%;">
<tr><td style="background:#00C8E9;padding:24px 32px;border-radius:12px 12px 0 0;">
  <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">legal&amp;life</p>
</td></tr>
<tr><td style="padding:32px;">
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 20px;">
  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
    このメールは legal&amp;life から自動送信されています。<br>
    心当たりがない場合は無視してください。<br>
    <a href="${siteUrl}" style="color:#00C8E9;">${esc(siteLabel)}</a>
  </p>
</td></tr></table></td></tr></table></body></html>`;
}

export function buildOtpHTML({ to_name, otp_code, expiry_minutes, purpose }: OtpMailParams): string {
  const n = esc(to_name || "ユーザー");
  return layout(`
<p style="margin:0 0 16px;color:#334155;font-size:15px;">${n} 様</p>
<p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
  以下の認証コードを入力してください。
</p>
<div style="background:#f0fdff;border:2px solid #00C8E9;border-radius:10px;
            padding:24px;text-align:center;margin-bottom:20px;">
  <span style="font-size:36px;font-weight:700;letter-spacing:14px;
               color:#0f172a;font-family:monospace;">
    ${esc(otp_code || "")}
  </span>
</div>
<p style="margin:0 0 8px;font-size:13px;color:#64748b;">
  ⏱ 有効期限: <strong>${esc(String(expiry_minutes ?? 5))}分</strong>
</p>
<p style="margin:0;font-size:13px;color:#64748b;">
  用途: ${esc(purpose || "本人確認")}
</p>`);
}

export function buildNoticeHTML({ to_name, purpose }: { to_name?: string; purpose?: string }): string {
  const n = esc(to_name || "ユーザー");
  return layout(`
<p style="margin:0 0 16px;color:#334155;font-size:15px;">${n} 様</p>
<p style="margin:0;color:#475569;font-size:15px;line-height:1.8;">
  ${esc(purpose || "")}
</p>`);
}

export type ContactMailParams = {
  from_name: string;
  reply_email?: string;
  gender?: string;
  age_group?: string;
  inquiry_type: string;
  category?: string;
  content: string;
  device_info?: Record<string, string>;
};

export function buildContactHTML(params: ContactMailParams): string {
  const rows: [string, string | undefined][] = [
    ["お名前", params.from_name],
    ["性別", params.gender],
    ["年代", params.age_group],
    ["返信先メール", params.reply_email],
    ["お問い合わせ種類", params.inquiry_type],
    ["分野", params.category],
  ];
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 8px;color:#64748b;font-size:13px;">${esc(label)}</td><td style="padding:4px 8px;font-size:13px;">${esc(value || "（なし）")}</td></tr>`,
    )
    .join("");
  return layout(`
<p style="margin:0 0 16px;color:#334155;font-size:15px;font-weight:700;">新しいお問い合わせ</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rowsHtml}</table>
<p style="margin:0 0 8px;color:#334155;font-size:13px;font-weight:700;">内容</p>
<p style="white-space:pre-wrap;color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;">${esc(params.content)}</p>`);
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `legal&life <${process.env.FROM_EMAIL}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Mail delivery failed");
  }
}
