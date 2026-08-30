// app/api/admin/tenants/route.ts
// API Route server-side — consume FastAPI Backend en PostgreSQL Nativo
// Protegida con ADMIN_SECRET

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "nodia_admin_2024";

function checkAuth(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === ADMIN_SECRET;
}

// GET — listar todos los tenants
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/tenants`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Error fetching from backend");
    const data = await res.json();
    return NextResponse.json(data.tenants || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — actualizar tenant
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { tenant_id, ...fields } = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/panel/tenant/${tenant_id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error("Error updating tenant in backend");
    return NextResponse.json({ status: "updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
