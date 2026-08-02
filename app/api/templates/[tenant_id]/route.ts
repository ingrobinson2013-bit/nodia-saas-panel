// app/api/templates/[tenant_id]/route.ts
// Proxy seguro server-side: obtiene plantillas de Meta sin exponer tokens al cliente

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v19.0";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tenant_id: string } }
) {
  const { tenant_id } = params;

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  try {
    // 1. Obtener waba_id y token desde Supabase con service key (server-side)
    const tenantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?tenant_id=eq.${tenant_id}&select=waba_id,wa_access_token`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const tenants = await tenantRes.json();
    const tenant = tenants?.[0];
    const wabaId = tenant?.waba_id;
    const accessToken = tenant?.wa_access_token;

    if (!wabaId || !accessToken) {
      return NextResponse.json(
        { templates: [], message: "waba_id o token no configurado para este tenant" },
        { status: 200 }
      );
    }

    // 2. Llamar a Meta Graph API (server-side, token nunca expuesto al cliente)
    const metaRes = await fetch(
      `${GRAPH_URL}/${wabaId}/message_templates?fields=id,name,status,language,category&limit=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!metaRes.ok) {
      const err = await metaRes.json();
      return NextResponse.json(
        { templates: [], error: err?.error?.message || "Error Meta API" },
        { status: 200 }
      );
    }

    const metaData = await metaRes.json();
    const templates = metaData.data || [];

    return NextResponse.json({ templates, total: templates.length });
  } catch (e: any) {
    return NextResponse.json(
      { templates: [], error: e?.message || "Error interno" },
      { status: 200 }
    );
  }
}
