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
