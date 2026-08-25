import { Message } from '@/lib/types';

export function getClientName(history?: Message[] | null): string | null {
  if (!history) return null;
  for (const msg of history) {
    try {
      const p = JSON.parse(msg.content);
      if (p?.name) return p.name;
    } catch {}
    const m = msg.content.match(/(?:mi nombre es:|nombre:|name:)\s*([^\n,]+)/i);
    if (m) return m[1].trim();
  }
  return null;
}

export function getIntent(content: string): { icon: string; label: string } {
  const c = content.toLowerCase();
  if (/cita|agendar|reservar|appointment|agenda/i.test(c)) return { icon: '📅', label: 'Solicitud de cita' };
  if (/corte|barba|afeitado|servicio|precio|cuánto/i.test(c)) return { icon: '💈', label: 'Consulta de servicio' };
  if (/gracias|confirmad|listo|perfecto|genial/i.test(c)) return { icon: '✅', label: 'Confirmación' };
  if (/hola|buenas|buenos|hey/i.test(c)) return { icon: '👋', label: 'Saludo inicial' };
  if (/\?/.test(content)) return { icon: '❓', label: 'Pregunta' };
  return { icon: '💬', label: 'Mensaje' };
}

const BOG = 'America/Bogota';

function bogotaDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: BOG });
}

export function getWaitTime(updatedAt: string): string {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function getTimeGroup(updatedAt: string): string {
  const nowStr = bogotaDateStr(new Date());
  const dateStr = bogotaDateStr(new Date(updatedAt));
  const yesterday = bogotaDateStr(new Date(Date.now() - 86400000));
  const weekAgo = bogotaDateStr(new Date(Date.now() - 6 * 86400000));

  if (dateStr === nowStr) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  if (dateStr >= weekAgo) return 'Esta semana';
  return 'Más antiguos';
}

export function isWaitingForResponse(history?: Message[] | null): boolean {
  if (!history || history.length === 0) return false;
  const visible = history.filter((m) => m.role !== 'system');
  if (visible.length === 0) return false;
  return visible[visible.length - 1].role === 'user';
}

export function getInitials(name: string | null, phone: string): string {
  if (name) return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return phone ? phone.slice(-2) : 'WA';
}

export type TagConfig = {
  label: string;
  bg: string;
  text: string;
  border: string;
  category: 'cita' | 'seguimiento' | 'pago' | 'ia';
};

export const AVAILABLE_TAGS: Record<string, TagConfig> = {
  cita_confirmada: { label: '✓ Cita Confirmada', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', category: 'cita' },
  cita_solicitada: { label: '📅 Cita Solicitada', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', category: 'cita' },
  en_proceso: { label: '⏳ En Proceso', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', category: 'seguimiento' },
  consulta_servicio: { label: '💈 Consulta Precios', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', category: 'seguimiento' },
  requiere_humano: { label: '⚠️ Atención Asesor', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', category: 'ia' },
  pago_pendiente: { label: '💳 Espera Adelanto', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', category: 'pago' },
  pago_recibido: { label: '💰 Pago Recibido', bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', category: 'pago' },
  cancelada: { label: '✕ Cancelada', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', category: 'cita' },
};

export function getTagStyle(tagKey: string) {
  return (
    AVAILABLE_TAGS[tagKey] || {
      label: tagKey,
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      category: 'seguimiento',
    }
  );
}

export function extractAppointmentFromHistory(history?: Message[] | null) {
  if (!history) return null;
  for (const msg of history) {
    try {
      const p = JSON.parse(msg.content);
      if (p && (p.action === 'BOOK' || p.action === 'CREATE_APPOINTMENT' || p.service || p.date)) {
        return {
          service: p.service || p.service_name || 'Servicio de Estética / Barbería',
          professional: p.professional || p.staff || 'Jose Roa',
          date: p.date || '2026-08-26',
          time: p.time || '15:00',
          price: p.price || 45000,
          status: 'confirmado' as const,
        };
      }
    } catch {}
  }
  return null;
}
