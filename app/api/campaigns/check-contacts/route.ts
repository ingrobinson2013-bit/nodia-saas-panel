// app/api/campaigns/check-contacts/route.ts
// Verifica qué contactos ya recibieron remarketing previo
// Compatible con Next.js 16

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.replace(/\D/g, "");
  if (!clean) return null;
  if (clean.length === 10 && clean.startsWith("3")) return `57${clean}`;
  if (clean.length === 12 && clean.startsWith("573")) return clean;
  if (clean.length >= 9) return clean;
  return null;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ results: {} });
  }

  const { tenant_id, phones = [] } = body;
  if (!tenant_id || phones.length === 0) {
    return NextResponse.json({ results: {} });
  }

  const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cleanPhones = phones
    .map((p: string) => normalizePhone(p))
    .filter(Boolean);

  if (cleanPhones.length === 0) {
    return NextResponse.json({ results: {} });
  }

  try {
    const inFilter = cleanPhones.map((p: string) => `"${p}"`).join(",");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/chat_sessions?tenant_id=eq.${tenant_id}&wa_from=in.(${inFilter})&select=wa_from,updated_at,history,name`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const sessions = await res.json();
    const results: Record<string, any> = {};

    for (const session of sessions || []) {
      const wa = session.wa_from;
      const history = session.history || [];
      const hasCampaign = history.some(
        (m: any) =>
          m?.content &&
          (m.content.includes("CAMPAÑA") || m.content.includes("REMARKETING"))
      );
      results[wa] = {
        already_sent: true,
        has_campaign_message: hasCampaign,
        last_interaction: session.updated_at,
        name: session.name || "Cliente",
      };
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: {} });
  }
}
