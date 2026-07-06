import { NextRequest, NextResponse } from "next/server";

// Resend Audience(配信リスト)管理API。旧legal-life-mailerのapi/audience.jsを統合。
// account設定のNOTIFSトグル(maintenance/feature/newsletter)のON/OFFから呼び出される。
const AUDIENCE_MAP: Record<string, string | undefined> = {
  maintenance: process.env.AUDIENCE_MAINTENANCE,
  feature: process.env.AUDIENCE_FEATURE,
  newsletter: process.env.AUDIENCE_NEWSLETTER,
};

export async function POST(req: NextRequest) {
  let body: { action?: string; email?: string; name?: string; audiences?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, email, name, audiences } = body;
  if (!email || !action || !audiences?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;

  await Promise.allSettled(
    audiences.map(async (audienceKey) => {
      const id = AUDIENCE_MAP[audienceKey];
      if (!id) return;
      if (action === "add") {
        await fetch(`https://api.resend.com/audiences/${id}/contacts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, first_name: name || "", unsubscribed: false }),
        });
        return;
      }
      const listRes = await fetch(`https://api.resend.com/audiences/${id}/contacts`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!listRes.ok) return;
      const { data } = (await listRes.json()) as { data?: { id: string; email: string }[] };
      const contact = data?.find((c) => c.email === email);
      if (!contact) return;
      await fetch(`https://api.resend.com/audiences/${id}/contacts/${contact.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${key}` },
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
