"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Bot, Save, CheckCircle, MessageCircle, Link2, Building2, Eye, EyeOff, FileText, Plus, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import WhatsAppConnect from "@/components/WhatsAppConnect";
import { getTenantId } from "@/lib/tenant";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://nodia-saas-nodia-backend.gvle2r.easypanel.host";

const TENANT_ID = getTenantId();

interface TenantConfig {
  nombre: string;
  plan: string;
  ai_prompt: string;
  wa_phone_id: string;
  wa_access_token: string;
  waba_id: string;
  odoo_url: string;
  odoo_db: string;
  odoo_user: string;
  odoo_api_key: string;
}

interface WaTemplate {
  id: string;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "PAUSED";
  language: string;
  category: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<TenantConfig>({
    nombre: "", plan: "", ai_prompt: "",
    wa_phone_id: "", wa_access_token: "", waba_id: "",
    odoo_url: "", odoo_db: "", odoo_user: "", odoo_api_key: "",
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [showOdooKey, setShowOdooKey] = useState(false);
  // Templates state
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [tplForm, setTplForm] = useState({ name: "", category: "UTILITY", body: "", header: "", footer: "", body_example: "" });
  const [tplSending, setTplSending] = useState(false);
  const [tplMsg, setTplMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.from("tenants").select("*")
      .eq("tenant_id", TENANT_ID).single()
      .then(({ data }) => { if (data) setConfig(data); setLoading(false); });
  }, []);

  const loadTemplates = async () => {
    setTplLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/templates/list/${TENANT_ID}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
    setTplLoading(false);
  };

  const createTemplate = async () => {
    if (!tplForm.name || !tplForm.body) return;
    setTplSending(true); setTplMsg(null);
    try {
      const res = await fetch(`${BACKEND}/api/templates/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: TENANT_ID,
          name: tplForm.name.toLowerCase().replace(/\s+/g, "_"),
          category: tplForm.category,
          body: tplForm.body,
          header: tplForm.header,
          footer: tplForm.footer,
          body_example: tplForm.body_example ? tplForm.body_example.split(",").map(s => s.trim()) : [],
          language: "es",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setTplMsg({ type: "ok", text: `Plantilla "${tplForm.name}" enviada a revisión de Meta (24-48h)` });
      setTplForm({ name: "", category: "UTILITY", body: "", header: "", footer: "", body_example: "" });
      loadTemplates();
    } catch (e: unknown) {
      setTplMsg({ type: "err", text: e instanceof Error ? e.message : "Error desconocido" });
    }
    setTplSending(false);
  };

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

      {/* Plantillas WhatsApp */}
      <Section icon={<FileText size={16} className="text-green-400" />} title="Plantillas WhatsApp"
        badge={<button onClick={loadTemplates} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs transition-all">
          <RefreshCw size={12} className={tplLoading ? "animate-spin" : ""} /> Cargar
        </button>}>

        {/* WABA ID */}
        <div className="mb-5">
          <label className={labelClass}>WABA ID <span className="text-white/20 normal-case">(WhatsApp Business Account ID)</span></label>
          <input className={inputClass} value={config.waba_id || ""} onChange={set("waba_id")} placeholder="Ej: 1804921890136057" />
          <p className="text-xs text-white/20 mt-1.5">Lo encuentras en Meta Business Manager → WhatsApp → Cuentas</p>
          <div className="flex justify-end mt-3">
            <button onClick={() => saveSection({ waba_id: config.waba_id }, "waba")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${saved === "waba" ? "bg-emerald-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"}` }>
              {saved === "waba" ? <><CheckCircle size={12}/> Guardado</> : <><Save size={12}/> Guardar WABA ID</>}
            </button>
          </div>
        </div>

        {/* Lista de plantillas */}
        {templates.length > 0 && (
          <div className="mb-5 space-y-2">
            <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3">Tus plantillas</p>
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-white font-mono">{t.name}</p>
                  <p className="text-xs text-white/30">{t.category} · {t.language}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}

        {/* Crear nueva plantilla */}
        <div className="border-t border-white/5 pt-5">
          <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-4 flex items-center gap-1.5"><Plus size={12}/> Nueva plantilla</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nombre <span className="text-white/20 normal-case">(sin espacios)</span></label>
                <input className={inputClass} value={tplForm.name} onChange={e => setTplForm(p=>({...p,name:e.target.value}))} placeholder="cita_confirmada" />
              </div>
              <div>
                <label className={labelClass}>Categoría</label>
                <select className={inputClass} value={tplForm.category} onChange={e => setTplForm(p=>({...p,category:e.target.value}))}>
                  <option value="UTILITY">Utilidad</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Autenticación</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Encabezado <span className="text-white/20 normal-case">(opcional)</span></label>
              <input className={inputClass} value={tplForm.header} onChange={e => setTplForm(p=>({...p,header:e.target.value}))} placeholder="✂️ Confirmación de Cita" />
            </div>
            <div>
              <label className={labelClass}>Cuerpo del mensaje <span className="text-cyan-400/60 normal-case">usa {"{{1}} {{2}}"} para variables</span></label>
              <textarea className={`${inputClass} min-h-[120px] resize-none font-mono text-xs`}
                value={tplForm.body} onChange={e => setTplForm(p=>({...p,body:e.target.value}))}
                placeholder={`Hola {{1}} 👋\n\nTu cita está confirmada ✅\n📅 {{2}}\n✂️ Servicio: {{3}}\n\n¡Te esperamos!`} />
            </div>
            <div>
              <label className={labelClass}>Ejemplos de variables <span className="text-white/20 normal-case">(separados por coma)</span></label>
              <input className={inputClass} value={tplForm.body_example} onChange={e => setTplForm(p=>({...p,body_example:e.target.value}))} placeholder="Juan Pérez, 06/05/2026 a las 4pm, Corte clásico" />
            </div>
            <div>
              <label className={labelClass}>Pie de página <span className="text-white/20 normal-case">(opcional)</span></label>
              <input className={inputClass} value={tplForm.footer} onChange={e => setTplForm(p=>({...p,footer:e.target.value}))} placeholder="NODIA · Agendamiento inteligente" />
            </div>
            {tplMsg && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${ tplMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {tplMsg.type === "ok" ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
                {tplMsg.text}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={createTemplate} disabled={tplSending || !tplForm.name || !tplForm.body}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all">
                {tplSending ? <><RefreshCw size={14} className="animate-spin"/> Enviando...</> : <><Plus size={14}/> Enviar a Meta</>}
              </button>
            </div>
          </div>
        </div>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    APPROVED: { label: "Aprobada",  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 size={12}/> },
    PENDING:  { label: "Pendiente", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20",       icon: <Clock size={12}/> },
    REJECTED: { label: "Rechazada", cls: "bg-red-500/15 text-red-400 border-red-500/20",             icon: <XCircle size={12}/> },
    PAUSED:   { label: "Pausada",   cls: "bg-white/10 text-white/40 border-white/10",                icon: <AlertCircle size={12}/> },
  };
  const s = map[status] ?? map["PENDING"];
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}