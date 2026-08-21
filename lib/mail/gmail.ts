import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | undefined;

// GmailのSMTPを直接使う(サードパーティESPはgmail.com等の共有ドメインを送信元として
// 認証できないため使えない。自分自身のGmailアカウントとして送るこの方式のみが
// 独自ドメインなしで実際にGmailアドレスから送信できる)。
// GMAIL_USER: 送信元Gmailアドレス、GMAIL_APP_PASSWORD: Googleアカウントで発行したアプリパスワード
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

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
  // 端末診断情報(lib/deviceInfo.tsのcollectDeviceInfo()がフラットなdevice_*キーとして送信する)
  device_browser?: string;
  device_os?: string;
  device_type?: string;
  device_ua?: string;
  device_screen?: string;
  device_viewport?: string;
  device_theme?: string;
  device_language?: string;
  device_timezone?: string;
  device_network?: string;
  device_country?: string;
  device_region?: string;
  device_city?: string;
  device_ip?: string;
  device_storage?: string;
  device_memory?: string;
  page_url?: string;
  page_referrer?: string;
  sent_at?: string;
};

const DEVICE_INFO_LABELS: [keyof ContactMailParams, string][] = [
  ["device_browser", "ブラウザ"],
  ["device_os", "OS"],
  ["device_type", "端末種別"],
  ["device_screen", "画面サイズ"],
  ["device_viewport", "表示領域"],
  ["device_theme", "テーマ"],
  ["device_language", "言語"],
  ["device_timezone", "タイムゾーン"],
  ["device_network", "ネットワーク"],
  ["device_country", "国"],
  ["device_region", "地域"],
  ["device_city", "市区町村"],
  ["device_ip", "IPアドレス"],
  ["device_storage", "localStorage使用量"],
  ["device_memory", "メモリ使用量"],
  ["page_url", "送信元URL"],
  ["page_referrer", "リファラー"],
  ["sent_at", "送信日時"],
  ["device_ua", "User-Agent"],
];

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

  const deviceRowsHtml = DEVICE_INFO_LABELS.filter(([key]) => params[key])
    .map(
      ([key, label]) =>
        `<tr><td style="padding:3px 8px;color:#94a3b8;font-size:12px;white-space:nowrap;">${esc(label)}</td><td style="padding:3px 8px;font-size:12px;word-break:break-all;">${esc(params[key])}</td></tr>`,
    )
    .join("");

  return layout(`
<p style="margin:0 0 16px;color:#334155;font-size:15px;font-weight:700;">新しいお問い合わせ</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rowsHtml}</table>
<p style="margin:0 0 8px;color:#334155;font-size:13px;font-weight:700;">内容</p>
<p style="white-space:pre-wrap;color:#334155;font-size:14px;line-height:1.7;margin:0 0 16px;">${esc(params.content)}</p>
${
  deviceRowsHtml
    ? `<p style="margin:0 0 8px;color:#94a3b8;font-size:12px;font-weight:700;">端末情報</p>
<table style="width:100%;border-collapse:collapse;">${deviceRowsHtml}</table>`
    : ""
}`);
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  await getTransporter().sendMail({
    from: `legal&life <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}
