// app/api/send-template/route.ts
// Envío directo de Plantilla Aprobada de Meta WhatsApp Cloud API desde el Chat

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v21.0";
const BEAUTYSYNC_DEFAULT_MEDIA_ID = "1514709553317181";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    tenant_id,
    session_id,
    wa_to,
    template_name = "contacto_inicial_beautysyncpro",
    client_name = "Cliente",
  } = body;

  if (!tenant_id || !wa_to) {
    return NextResponse.json({ error: "tenant_id y wa_to son requeridos" }, { status: 400 });
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

    // Normalizar número de teléfono (ej. 57311...)
    let toPhone = wa_to.replace(/\D/g, "");
    if (toPhone.length === 10 && toPhone.startsWith("3")) toPhone = `57${toPhone}`;

    const formattedFirstName = client_name.trim().split(" ")[0] || "estimado cliente";

    // 2. Construir payload según la plantilla oficial de Meta
    let langCode = "es_CO";
    let components: any[] = [];
    let textRepresentation = "";

    if (template_name === "contacto_inicial_beautysyncpro" || template_name.includes("contacto_inicial")) {
      langCode = "es_CO";
      components = [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: { id: BEAUTYSYNC_DEFAULT_MEDIA_ID },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "nombre",
              text: formattedFirstName,
            },
          ],
        },
      ];
      textRepresentation = `Hola ${formattedFirstName} 👋\n\nTe escribimos de TESO Consulting con una novedad importante.\n\nLanzamos *BeautySync Pro*: el primer software para barberías y salones que se subsidia con tus compras de insumos.\n\n✅ Agenda inteligente 24/7\n✅ Sitio Web y App de Reservas\n✅ Profesionales Ilimitados\n✅ Facturación electrónica DIAN (Opcional)\n✅ Control de inventario\n✅ Comisiones automatizadas\n\n*Activación con la Compra de tus Insumos de las Marcas Aliadas*\nSin mensualidades fijas. Pagas según tu volumen de Compra.\n\n¿Te interesa info? Responde INFO\nPara no recibir más mensajes responde BAJA`;
    } else if (template_name === "retoma_pos_electronico") {
      langCode = "es";
      components = [];
      textRepresentation = `Hola👋 Amigo Empresario, nuestro propósito es Automatizar tu Negocio y ayudarte a cumplir con la DIAN de forma fácil con TESO FEL POS.\n\nActiva hoy mismo tu POS Electrónico.\n\n✅ Inventario actualizado siempre\n✅ Reportes de ventas y caja\n✅ Conexión Contable`;
    } else if (template_name === "confirmacon_cita" || template_name === "confirmacion_cita") {
      langCode = "es";
      components = [];
      textRepresentation = `¡Hola ${formattedFirstName}! Te confirmamos tu cita agendada en Odoo. ¡Te esperamos!`;
    } else {
      langCode = "es";
      components = [];
      textRepresentation = `Plantilla Meta: ${template_name}`;
    }

    const metaPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "template",
      template: {
        name: template_name,
        language: { code: langCode },
        components: components,
      },
    };

    // 3. Enviar a Meta WhatsApp Cloud API
    const metaRes = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metaPayload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok || metaData.error) {
      console.error("Error enviando plantilla a Meta:", metaData);
      return NextResponse.json(
        { error: metaData.error?.message || "Error rechazado por Meta Cloud API" },
        { status: 400 }
      );
    }

    // 4. Guardar en historial de Supabase (chat_sessions) si se suministró session_id
    if (session_id) {
      const sessionRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_sessions?id=eq.${session_id}&select=history`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const sessions = await sessionRes.json();
      const currentHistory = sessions?.[0]?.history || [];

      const newHistoryEntry = {
        role: "agent",
        content: `✨ [PLANTILLA META: ${template_name}]\n\n${textRepresentation}`,
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
      template: template_name,
      to: toPhone,
    });
  } catch (err: any) {
    console.error("Error en /api/send-template:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
