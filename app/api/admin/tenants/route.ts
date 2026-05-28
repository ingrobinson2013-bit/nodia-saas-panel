// app/api/admin/tenants/route.ts
// API Route server-side — usa service_role para ver TODOS los tenants
// Protegida con ADMIN_SECRET (nunca expuesta al browser)

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || "placeholder_key"  // ← service role, solo server-side
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || "nodia_admin_2024";

function checkAuth(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === ADMIN_SECRET;
}

// GET — listar todos los tenants
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("tenants").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — actualizar tenant (activo, plan)
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { tenant_id, ...fields } = await req.json();
  const { error } = await supabaseAdmin.from("tenants").update(fields).eq("tenant_id", tenant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: "updated" });
}

// POST — registrar un nuevo tenant
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { nombre, odoo_url, odoo_db, odoo_user, odoo_api_key } = await req.json();
    
    if (!nombre || !odoo_url || !odoo_db || !odoo_user || !odoo_api_key) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    const tenant_id = crypto.randomUUID();
    const temp_phone_id = `TEMP_${Math.random().toString(36).substring(2, 10)}`;
    const temp_token = `TEMP_TOKEN_${Math.random().toString(36).substring(2, 15)}`;

    // 1. Insertar Tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        tenant_id,
        nombre,
        wa_phone_id: temp_phone_id,
        wa_access_token: temp_token,
        odoo_url,
        odoo_db,
        odoo_user,
        odoo_api_key,
        activo: true,
        plan: "basico"
      })
      .select()
      .single();

    if (tenantError) {
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }

    // 2. Insertar Configuración inicial de Bot
    const { error: configError } = await supabaseAdmin
      .from("tenant_config")
      .insert({
        tenant_id,
        direccion: "Calle Ficticia # 123, Bogotá",
        horario: "Lun-Sáb 9am-8pm, Dom 10am-6pm",
        servicios_texto: "Corte de cabello: $25.000 (30min) | Corte + Barba: $40.000 (45min)",
        servicios_json: [
          { nombre: "Corte de cabello", precio: 25000, duracion: 30 },
          { nombre: "Corte + Barba", precio: 40000, duracion: 45 }
        ]
      });

    if (configError) {
      console.error("Error creating tenant config:", configError);
      // No fallamos el request principal ya que el tenant ya fue creado
    }

    return NextResponse.json(tenantData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

