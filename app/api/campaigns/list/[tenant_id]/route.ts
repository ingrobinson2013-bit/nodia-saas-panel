// app/api/campaigns/list/[tenant_id]/route.ts
// Lista el historial de campañas enviadas por el tenant
// Compatible con Next.js 16 (params como Promise)

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  const { tenant_id } = await params;

  if (!tenant_id) {
    return NextResponse.json({ campaigns: [] });
  }

  const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/campaigns?tenant_id=eq.${tenant_id}&order=created_at.desc&limit=20`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const data = await res.json();
    // Garantizar que siempre retornamos un array — si la tabla no existe
    // Supabase devuelve un objeto de error, no un array
    const campaigns = Array.isArray(data) ? data : [];
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
