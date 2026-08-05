import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  try {
    const { tenant_id } = await params;

    // Crear cliente Supabase de forma lazy (dentro del handler, no a nivel de módulo)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener credenciales del tenant
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("wa_phone_id, wa_access_token")
      .eq("tenant_id", tenant_id)
      .single();

    if (error || !tenants) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const { wa_phone_id, wa_access_token } = tenants;

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
