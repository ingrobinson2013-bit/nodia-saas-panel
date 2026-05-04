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

export interface ChatSession {
  id: string;
  tenant_id: string;
  wa_from: string;
  history: Message[];
  estado: 'activo' | 'cerrado';
  cita_odoo_id?: number;
  updated_at: string;
  bot_mode: boolean;
  name?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp?: string;
}
