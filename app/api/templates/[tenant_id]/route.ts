// app/api/templates/[tenant_id]/route.ts
// Proxy seguro server-side: obtiene plantillas de Meta sin exponer tokens al cliente
// Compatible con Next.js 16 (params es Promise)

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v19.0";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  // En Next.js 16, params es una Promise
  const { tenant_id } = await params;

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  try {
    const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Obtener waba_id y token desde Supabase con service key (server-side)
    const tenantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?tenant_id=eq.${tenant_id}&select=nombre,waba_id,wa_access_token`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const tenants = await tenantRes.json();
    const tenant = tenants?.[0];
    const wabaId = tenant?.waba_id;
    const accessToken = tenant?.wa_access_token;
    const tenantName = tenant?.nombre;

    if (!wabaId || !accessToken) {
      return NextResponse.json(
        { templates: [], message: "waba_id o token no configurado para este tenant" },
        { status: 200 }
      );
    }

    // 2. Llamar a Meta Graph API (server-side — token nunca expuesto al cliente)
    const metaRes = await fetch(
      `${GRAPH_URL}/${wabaId}/message_templates?fields=id,name,status,language,category,components&limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!metaRes.ok) {
      const err = await metaRes.json();
      return NextResponse.json(
        { templates: [], error: err?.error?.message || "Error Meta API", tenant_name: tenantName },
        { status: 200 }
      );
    }

    const metaData = await metaRes.json();
    const templates = metaData.data || [];

    return NextResponse.json({ templates, total: templates.length, tenant_name: tenantName });
  } catch (e: any) {
    return NextResponse.json(
      { templates: [], error: e?.message || "Error interno" },
      { status: 200 }
    );
  }
}
