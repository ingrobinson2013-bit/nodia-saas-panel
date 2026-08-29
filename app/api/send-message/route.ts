// app/api/send-message/route.ts
// Envío de mensaje de texto libre desde el chat a Meta WhatsApp Cloud API
// Valida si la ventana de 24 horas está abierta o si Meta rechaza el envío

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { tenant_id, session_id, wa_to, message } = body;

  if (!tenant_id || !wa_to || !message) {
    return NextResponse.json(
      { error: "tenant_id, wa_to y message son requeridos" },
      { status: 400 }
    );
  }

  try {
    const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Obtener credenciales del tenant
    const tenantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?tenant_id=eq.${tenant_id}&select=nombre,wa_phone_id,wa_access_token,activo`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    const tenants = await tenantRes.json();
    const tenant = tenants?.[0];

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }
    if (!tenant.activo) {
      return NextResponse.json({ error: "Tenant inactivo" }, { status: 403 });
    }

    const phoneId = tenant.wa_phone_id;
    const accessToken = tenant.wa_access_token;

    if (!phoneId || !accessToken) {
      return NextResponse.json(
        { error: "Credenciales de Meta WhatsApp no configuradas para este negocio." },
        { status: 400 }
      );
    }

    // Normalizar número telefónico
    let toPhone = wa_to.replace(/\D/g, "");
    if (toPhone.length === 10 && toPhone.startsWith("3")) toPhone = `57${toPhone}`;

    const metaPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: {
        body: message,
        preview_url: false,
      },
    };

    // 2. Enviar a Meta WhatsApp Cloud API
    const metaRes = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await metaRes.json();

    // 3. Manejo de Errores de Meta (Especialmente Ventana de 24 horas)
    if (!metaRes.ok || metaData.error) {
      const errCode = metaData.error?.code;
      const errorMsg = metaData.error?.message || "Error al enviar mensaje";
      const errorDetails = metaData.error?.error_data?.details || "";

      // Detección de ventana de 24 horas cerrada (Código 131047 / 131026 / 131045)
      const is24hExpired =
        errCode === 131047 ||
        errCode === 131026 ||
        errCode === 131045 ||
        errorMsg.toLowerCase().includes("24 hours") ||
        errorDetails.toLowerCase().includes("24 hours") ||
        errorMsg.toLowerCase().includes("re-engagement");

      console.warn(`[WhatsApp API Error] to=${toPhone} code=${errCode}: ${errorMsg}`);

      return NextResponse.json(
        {
          error: errorMsg,
          code: errCode,
          details: errorDetails,
          is_24h_expired: is24hExpired,
        },
        { status: 400 }
      );
    }

    // 4. Guardar en historial de Supabase si se envió exitosamente
    if (session_id) {
      const sessionRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_sessions?id=eq.${session_id}&select=history`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const sessions = await sessionRes.json();
      const currentHistory = sessions?.[0]?.history || [];

      const newHistoryEntry = {
        role: "agent",
        content: message,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...currentHistory, newHistoryEntry];

      await fetch(`${SUPABASE_URL}/rest/v1/chat_sessions?id=eq.${session_id}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: updatedHistory,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message_id: metaData.messages?.[0]?.id,
      to: toPhone,
    });
  } catch (err: any) {
    console.error("Error en /api/send-message:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
