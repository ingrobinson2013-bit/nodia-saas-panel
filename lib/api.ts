// lib/api.ts
// Cliente API REST para NODIA SaaS Panel — 100% FastAPI & PostgreSQL

import { ChatSession, Tenant } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export interface ClientMemoryProfile {
  id: number;
  tenant_id: string;
  wa_from: string;
  nombre_cliente?: string;
  profesional_favorito?: string;
  servicios_frecuentes?: Record<string, number>;
  dias_preferidos?: Record<string, number>;
  horario_habitual?: string;
  total_citas_agendadas: number;
  ultima_cita_fecha?: string;
  notas_estilo?: string;
  updated_at: string;
}

export interface AppointmentRecord {
  id: number;
  tenant_id: string;
  wa_from: string;
  cliente_nombre: string;
  servicio: string;
  profesional: string;
  fecha_cita: string;
  hora_cita: string;
  odoo_event_id?: number;
  estado: string;
  origen: string;
  created_at: string;
}

// ── 1. Tenants ────────────────────────────────────────────────────────
export async function getTenants(): Promise<Tenant[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/tenants`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tenants || [];
  } catch (err) {
    console.error('Error fetching tenants:', err);
    return [];
  }
}

export async function getTenantDetail(tenantId: string): Promise<{ tenant: Tenant | null; config: any }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/tenant/${tenantId}`, { cache: 'no-store' });
    if (!res.ok) return { tenant: null, config: {} };
    const data = await res.json();
    return { tenant: data.tenant || null, config: data.config || {} };
  } catch (err) {
    console.error(`Error fetching tenant ${tenantId}:`, err);
    return { tenant: null, config: {} };
  }
}

export async function updateTenantConfig(tenantId: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/tenant/${tenantId}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error(`Error updating tenant config ${tenantId}:`, err);
    return false;
  }
}

// ── 2. Chat Sessions (Inbox) ──────────────────────────────────────────
export async function getChatSessions(tenantId: string, limit: number = 50): Promise<ChatSession[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/sessions?tenant_id=${tenantId}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error(`Error fetching sessions for tenant ${tenantId}:`, err);
    return [];
  }
}

export async function getChatSessionDetail(sessionId: string): Promise<ChatSession | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/sessions/${sessionId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session || null;
  } catch (err) {
    console.error(`Error fetching session ${sessionId}:`, err);
    return null;
  }
}

export async function setBotMode(sessionId: string, mode: 'auto' | 'manual'): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/sessions/${sessionId}/bot-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_mode: mode }),
    });
    return res.ok;
  } catch (err) {
    console.error(`Error toggling bot mode for session ${sessionId}:`, err);
    return false;
  }
}

// ── 3. Send Message from Agent ────────────────────────────────────────
export async function sendAgentMessage(
  tenantId: string,
  waTo: string,
  message: string,
  sessionId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        wa_to: waTo,
        message: message,
        session_id: sessionId,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending agent message:', err);
    return false;
  }
}

// ── 4. Appointments (Citas) ───────────────────────────────────────────
export async function getAppointments(tenantId: string, limit: number = 50): Promise<AppointmentRecord[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/appointments?tenant_id=${tenantId}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.appointments || [];
  } catch (err) {
    console.error(`Error fetching appointments for tenant ${tenantId}:`, err);
    return [];
  }
}

// ── 5. Client Memory (Aprendizaje Continuo) ───────────────────────────
export async function getClientMemory(tenantId: string, limit: number = 50): Promise<ClientMemoryProfile[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/panel/memory?tenant_id=${tenantId}&limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.clients || [];
  } catch (err) {
    console.error(`Error fetching memory for tenant ${tenantId}:`, err);
    return [];
  }
}

// ── 6. Intent Logs (Fast-Path Audit) ──────────────────────────────────
export async function getIntentLogs(tenantId?: string, limit: number = 50): Promise<any[]> {
  try {
    const url = tenantId
      ? `${BACKEND_URL}/api/panel/intent-logs?tenant_id=${tenantId}&limit=${limit}`
      : `${BACKEND_URL}/api/panel/intent-logs?limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('Error fetching intent logs:', err);
    return [];
  }
}

// ── 7. Telemetría y ROI IA Agregado (Admin) ───────────────────────────
export interface TelemetryData {
  metrics: {
    total_interactions: number;
    fastpath_count: number;
    llm_count: number;
    fastpath_ratio: number;
    avg_fastpath_ms: number;
    avg_llm_ms: number;
    cost_saved_usd: number;
    total_vip_clients: number;
    breakdown: Record<string, number>;
  };
  recent_logs: any[];
  top_memory: ClientMemoryProfile[];
}

export async function getTelemetryStats(tenantId?: string): Promise<TelemetryData | null> {
  try {
    const url = tenantId
      ? `${BACKEND_URL}/api/panel/telemetry?tenant_id=${tenantId}`
      : `${BACKEND_URL}/api/panel/telemetry`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching telemetry stats:', err);
    return null;
  }
}
