import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  try {
    const { tenant_id } = await params;

    const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Obtener credenciales del tenant via REST (mismo patrón que /api/templates)
    const tenantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?tenant_id=eq.${tenant_id}&select=wa_phone_id,wa_access_token`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const tenants = await tenantRes.json();
    const tenant = tenants?.[0];

    if (!tenant?.wa_phone_id || !tenant?.wa_access_token) {
      return NextResponse.json({ error: "Credenciales WhatsApp no encontradas para este tenant" }, { status: 404 });
    }

    const { wa_phone_id, wa_access_token } = tenant;

    // 2. Leer el archivo del body (multipart/form-data)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa JPG o PNG." },
        { status: 400 }
      );
    }

    // 3. Subir al Media API de WhatsApp
    const waForm = new FormData();
    waForm.append("file", file, file.name);
    waForm.append("type", file.type);
    waForm.append("messaging_product", "whatsapp");

    const uploadRes = await fetch(`${GRAPH_URL}/${wa_phone_id}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${wa_access_token}`,
      },
      body: waForm,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.id) {
      console.error("[MediaUpload] Meta upload error:", uploadData);
      return NextResponse.json(
        { error: uploadData?.error?.message || "Error al subir imagen a WhatsApp" },
        { status: 500 }
      );
    }

    return NextResponse.json({ media_id: uploadData.id, success: true });
  } catch (err: any) {
    console.error("[MediaUpload] Error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
