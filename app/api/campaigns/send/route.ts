// app/api/campaigns/send/route.ts
// Proxy server-side: envío masivo de campaña vía WhatsApp Cloud API
// Compatible con Next.js 16 (params como Promise)

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GRAPH_URL = "https://graph.facebook.com/v21.0";

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.replace(/\D/g, "");
  if (!clean) return null;
  if (clean.length === 10 && clean.startsWith("3")) return `57${clean}`;
  if (clean.length === 12 && clean.startsWith("573")) return clean;
  if (clean.length >= 9) return clean;
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    tenant_id,
    campaign_name = "Campaña Remarketing",
    message_type = "text",
    message = "",
    template_name,
    template_language = "es",
    contacts = [],
    delay_seconds = 1.0,
    save_record = true,       // false en lotes intermedios
    total_override,           // total real de toda la campaña (para el registro)
    sent_override = 0,        // acumulado de lotes anteriores
    failed_override = 0,      // acumulado de lotes anteriores
  } = body;

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  try {
    const supabaseKey = SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 1. Obtener datos del tenant
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
        { error: "Credenciales de WhatsApp no configuradas para este negocio." },
        { status: 400 }
      );
    }

    // 2. Sanitizar nombre de plantilla
    let cleanTplName = (template_name || "").split("(")[0].trim();
    let langCode = template_language || "en_US";

    // Resolver language según la plantilla
    if (cleanTplName === "contacto_inicial_beautysyncpro" || cleanTplName.includes("contacto_inicial")) {
      cleanTplName = "contacto_inicial_beautysyncpro";
      langCode = "es_CO";
    } else if (cleanTplName === "retoma_pos_electronico") {
      langCode = "es";
    } else if (cleanTplName === "confirmacion_cita" || cleanTplName === "confirmacon_cita") {
      langCode = "es_CO";
    }

    // 3. Enviar a cada contacto
    let sentCount = 0;
    let failedCount = 0;
    const details: any[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const item = contacts[i];
      let rawPhone = typeof item === "string" ? item : item?.phone || "";
      let contactName = typeof item === "string" ? "Cliente" : item?.name || "Cliente";

      const cleanPhone = normalizePhone(rawPhone);
      if (!cleanPhone) {
        failedCount++;
        details.push({ raw: rawPhone, status: "failed", reason: "Número inválido" });
        continue;
      }

      const personalizedText = message
        .replace("{nombre}", contactName)
        .replace("{negocio}", tenant.nombre || "");

      try {
        let waPayload: any;

        if (message_type === "template" && cleanTplName) {
          // Componentes según la plantilla
          let components: any[] = [];

          if (cleanTplName === "contacto_inicial_beautysyncpro") {
            components = [
              {
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: {
                      link: "https://gtrxvfqgytkpvdgmzcgu.supabase.co/storage/v1/object/public/public-assets/beautysync_header.jpg",
                    },
                  },
                ],
              },
              {
                type: "body",
                parameters: [{ type: "text", parameter_name: "nombre", text: contactName }],
              },
            ];
          } else if (cleanTplName === "retoma_pos_electronico") {
            components = [
              {
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: {
                      link: "https://gtrxvfqgytkpvdgmzcgu.supabase.co/storage/v1/object/public/public-assets/beautysync_header.jpg",
                    },
                  },
                ],
              },
            ];
          }

          waPayload = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: cleanTplName,
              language: { code: langCode },
              components,
            },
          };
        } else {
          waPayload = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: personalizedText },
          };
        }

        // Llamar a WhatsApp Cloud API
        const waRes = await fetch(`${GRAPH_URL}/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(waPayload),
        });

        const waData = await waRes.json();

        if (!waRes.ok || waData.error) {
          throw new Error(waData?.error?.message || `HTTP ${waRes.status}`);
        }

        sentCount++;
        details.push({ phone: cleanPhone, name: contactName, status: "sent" });

        // Registrar en chat_sessions
        try {
          const nowIso = new Date().toISOString();
          const sessionRes = await fetch(
            `${SUPABASE_URL}/rest/v1/chat_sessions?tenant_id=eq.${tenant_id}&wa_from=eq.${cleanPhone}&select=id,history`,
            { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
          );
          const sessions = await sessionRes.json();

          const campaignMsg = {
            role: "agent",
            content: `📢 [CAMPAÑA: ${campaign_name}]\n${personalizedText}`,
            timestamp: nowIso,
          };

          if (sessions?.length > 0) {
            const existing = sessions[0];
            const history = [...(existing.history || []), campaignMsg];
            await fetch(
              `${SUPABASE_URL}/rest/v1/chat_sessions?id=eq.${existing.id}`,
              {
                method: "PATCH",
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({ history, estado: "agente_ia", updated_at: nowIso }),
              }
            );
          } else {
            await fetch(`${SUPABASE_URL}/rest/v1/chat_sessions`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                tenant_id,
                wa_from: cleanPhone,
                name: contactName,
                estado: "agente_ia",
                history: [campaignMsg],
                updated_at: nowIso,
              }),
            });
          }
        } catch (_) {
          // Sesión fallida — no bloquea el envío
        }
      } catch (err: any) {
        failedCount++;
        details.push({ phone: cleanPhone, name: contactName, status: "failed", reason: err.message });
      }

      // Pausa anti-spam
      if (i < contacts.length - 1 && delay_seconds > 0) {
        await sleep(delay_seconds * 1000);
      }
    }

    // 4. Registrar campaña en Supabase
    // 4. Registrar campaña en Supabase — solo en el último lote
    if (save_record) {
      const totalFinal = total_override ?? contacts.length;
      const sentFinal = sent_override + sentCount;
      const failedFinal = failed_override + failedCount;
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/campaigns`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            tenant_id,
            name: campaign_name,
            total_contacts: totalFinal,
            sent_count: sentFinal,
            failed_count: failedFinal,
            message_type,
            message,
            created_at: new Date().toISOString(),
          }),
        });
      } catch (_) {
        // No bloquea si falla el registro
      }
    }

    return NextResponse.json({
      status: "success",
      campaign_name,
      total: contacts.length,
      sent: sentCount,
      failed: failedCount,
      details,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
