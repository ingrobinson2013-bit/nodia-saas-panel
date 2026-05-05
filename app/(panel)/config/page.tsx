"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bot, Save, CheckCircle, MessageCircle, Link2, Building2, Eye, EyeOff } from "lucide-react";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import { getTenantId } from "@/lib/tenant";

const TENANT_ID = getTenantId();

interface TenantConfig {
  nombre: string;
  plan: string;
  ai_prompt: string;
  wa_phone_id: string;
  wa_access_token: string;
  odoo_url: string;
  odoo_db: string;
  odoo_user: string;
  odoo_api_key: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<TenantConfig>({
    nombre: "", plan: "", ai_prompt: "",
    wa_phone_id: "", wa_access_token: "",
    odoo_url: "", odoo_db: "", odoo_user: "", odoo_api_key: "",
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [showOdooKey, setShowOdooKey] = useState(false);

  useEffect(() => {
    supabase.from("tenants").select("*")
      .eq("tenant_id", TENANT_ID).single()
      .then(({ data }) => { if (data) setConfig(data); setLoading(false); });
  }, []);

  const saveSection = async (fields: Partial<TenantConfig>, section: string) => {
    await supabase.from("tenants").update(fields).eq("tenant_id", TENANT_ID);
    setSaved(section);
    setTimeout(() => setSaved(null), 3000);
  };

  const set = (key: keyof TenantConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setConfig(prev => ({ ...prev, [key]: e.target.value }));

  if (loading) return <div className="flex items-center justify-center h-full text-white/30 text-sm">Cargando...</div>;

  const inputClass = "w-full bg-[#0a0d14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all";
  const labelClass = "block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold";

  const SaveButton = ({ section, fields }: { section: string; fields: Partial<TenantConfig> }) => (
    <div className="flex justify-end mt-5">
      <button onClick={() => saveSection(fields, section)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saved === section ? "bg-emerald-600 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"}`}>
        {saved === section ? <><CheckCircle size={15} /> Guardado</> : <><Save size={15} /> Guardar</>}
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Configuración</h1>
        <p className="text-white/40 text-sm">Gestiona tu agente IA y las integraciones</p>
      </div>

      {/* Info del negocio */}
      <Section icon={<Building2 size={16} className="text-violet-400" />} title="Mi negocio"
        badge={<span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${config.plan === "pro" ? "bg-violet-500/20 text-violet-400" : "bg-emerald-500/20 text-emerald-400"}`}>{config.plan}</span>}>
        <div>
          <label className={labelClass}>Nombre del negocio</label>
          <input className={inputClass} value={config.nombre} onChange={set("nombre")} placeholder="Ej. Barbería El Estilo" />
        </div>
        <SaveButton section="negocio" fields={{ nombre: config.nombre }} />
      </Section>

      {/* Agente IA */}
      <Section icon={<Bot size={16} className="text-cyan-400" />} title="Personalidad de tu IA">
        <p className="text-xs text-white/30 mb-4">
          Define cómo se comporta tu agente. Incluye nombre, tono, servicios y horario.
          Usa <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan-400">{"{nombre}"}</code> para personalizar mensajes.
        </p>
        <div className="relative">
          <textarea className={`${inputClass} min-h-[200px] resize-none`}
            value={config.ai_prompt} onChange={set("ai_prompt")}
            placeholder={`Eres VALE, asistente de Barbería El Estilo en Bogotá.\nServicios: Corte $15.000, Barba $10.000, Combo $22.000.\nHorario: Lun-Sab 8am-7pm.\nResponde siempre en texto amable, nunca en JSON. ✂️`} />
          <span className="absolute bottom-3 right-4 text-xs text-white/20">{config.ai_prompt.length} chars</span>
        </div>
        <SaveButton section="prompt" fields={{ ai_prompt: config.ai_prompt }} />
      </Section>

      {/* WhatsApp */}
      <Section icon={<MessageCircle size={16} className="text-emerald-400" />} title="WhatsApp Business">
        {/* Botón Embedded Signup */}
        <div className="mb-6 pb-6 border-b border-white/5">
          <p className="text-xs text-white/40 mb-3 font-semibold uppercase tracking-wider">Conexión automática (recomendado)</p>
          <WhatsAppConnect
            tenantId={TENANT_ID}
            onConnected={(phoneId) => setConfig(prev => ({ ...prev, wa_phone_id: phoneId }))}
          />
        </div>

        {/* Configuración manual como respaldo */}
        <p className="text-xs text-white/30 mb-4 font-semibold uppercase tracking-wider">O configura manualmente</p>
        <p className="text-xs text-white/20 mb-4">
          Obtén estos datos en <span className="text-emerald-400">Meta for Developers → WhatsApp → Configuración</span>
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Phone Number ID</label>
            <input className={inputClass} value={config.wa_phone_id} onChange={set("wa_phone_id")} placeholder="Ej. 120364123456789" />
          </div>
          <div>
            <label className={labelClass}>Access Token (permanente)</label>
            <div className="relative">
              <input className={inputClass} type={showToken ? "text" : "password"}
                value={config.wa_access_token} onChange={set("wa_access_token")} placeholder="EAAFx..." />
              <button onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        <SaveButton section="whatsapp" fields={{ wa_phone_id: config.wa_phone_id, wa_access_token: config.wa_access_token }} />
      </Section>

      {/* Odoo — todos los planes */}
      <Section icon={<Link2 size={16} className="text-amber-400" />} title="Integración Odoo">
          <p className="text-xs text-white/30 mb-4">Conecta tu instancia de Odoo para consultar stock y agendar citas automáticamente.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL de Odoo</label>
              <input className={inputClass} value={config.odoo_url} onChange={set("odoo_url")} placeholder="https://miodoo.odoo.com" />
            </div>
            <div>
              <label className={labelClass}>Base de datos</label>
              <input className={inputClass} value={config.odoo_db} onChange={set("odoo_db")} placeholder="nombre-db" />
            </div>
            <div>
              <label className={labelClass}>Usuario</label>
              <input className={inputClass} value={config.odoo_user} onChange={set("odoo_user")} placeholder="admin@correo.com" />
            </div>
            <div>
              <label className={labelClass}>API Key</label>
              <div className="relative">
                <input className={inputClass} type={showOdooKey ? "text" : "password"}
                  value={config.odoo_api_key} onChange={set("odoo_api_key")} placeholder="tu_api_key_odoo" />
                <button onClick={() => setShowOdooKey(!showOdooKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showOdooKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <SaveButton section="odoo" fields={{ odoo_url: config.odoo_url, odoo_db: config.odoo_db, odoo_user: config.odoo_user, odoo_api_key: config.odoo_api_key }} />
        </Section>
    </div>
  );
}

function Section({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-white flex items-center gap-2">{icon} {title}</h2>
        {badge}
      </div>
      {children}
    </div>
  );
}
