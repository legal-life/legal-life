import { NextRequest, NextResponse } from "next/server";

// Resend Segment(配信リスト、旧称Audience)管理API。旧legal-life-mailerのapi/audience.jsを統合。
// account設定のNOTIFSトグル(maintenance/feature/newsletter)のON/OFFから呼び出される。
//
// Resendは2026年にAudiences(aud_)からSegments(seg_)へ全面移行しており、Contactsは
// audience/segmentに紐づかないグローバルなエンティティになった。そのため現在は
// 1) メールアドレスからグローバルContactを取得/作成し、
// 2) そのContact IDをSegmentへ追加/削除する、という2段階のフローになる。
const SEGMENT_MAP: Record<string, string | undefined> = {
  maintenance: process.env.SEGMENT_MAINTENANCE,
  feature: process.env.SEGMENT_FEATURE,
  newsletter: process.env.SEGMENT_NEWSLETTER,
};

async function getOrCreateContactId(email: string, name: string | undefined, key: string | undefined) {
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const getRes = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, { headers });
  if (getRes.ok) {
    const contact = (await getRes.json()) as { id: string };
    return contact.id;
  }

  const createRes = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers,
    body: JSON.stringify({ email, first_name: name || "", unsubscribed: false }),
  });
  if (!createRes.ok) return null;
  const created = (await createRes.json()) as { id: string };
  return created.id;
}

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
  const headers = { Authorization: `Bearer ${key}` };

  const contactId = await getOrCreateContactId(email, name, key);
  if (!contactId) return NextResponse.json({ error: "Failed to resolve contact" }, { status: 500 });

  await Promise.allSettled(
    audiences.map(async (segmentKey) => {
      const segmentId = SEGMENT_MAP[segmentKey];
      if (!segmentId) return;
      const url = `https://api.resend.com/contacts/${contactId}/segments/${segmentId}`;
      if (action === "add") {
        await fetch(url, { method: "POST", headers });
      } else {
        await fetch(url, { method: "DELETE", headers });
      }
    }),
  );

  return NextResponse.json({ ok: true });
}
