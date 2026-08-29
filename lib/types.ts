export interface Tenant {
  tenant_id: string;
  nombre: string;
  wa_phone_id: string;
  wa_access_token: string;
  odoo_url?: string;
  odoo_db?: string;
  odoo_user?: string;
  odoo_api_key?: string;
  activo: boolean;
  plan: 'basico' | 'pro';
  ai_prompt?: string;
  created_at: string;
}

export type MessageRole = 'user' | 'assistant' | 'agent' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: string;
  isTemplate?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error_24h';
  error?: string;
}

export type InternalNote = {
  id: string;
  text: string;
  author: string;
  created_at: string;
};

export type OdooAppointmentData = {
  id?: number | string;
  cliente_nombre?: string;
  telefono?: string;
  servicio?: string;
  profesional?: string;
  fecha?: string;
  hora?: string;
  duracion?: string;
  precio?: number;
  estado?: 'pendiente' | 'confirmado' | 'atendido' | 'cancelado';
  direccion?: string;
};

export interface ChatSession {
  id: string;
  tenant_id: string;
  wa_from: string;
  history: Message[];
  estado: string;
  cita_odoo_id?: number | null;
  updated_at: string;
  bot_mode: boolean;
  name?: string;
  tags?: string[];
  notes?: InternalNote[];
  agent_name?: string;
  appointment?: OdooAppointmentData;
}
