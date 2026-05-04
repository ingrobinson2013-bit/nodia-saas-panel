"use client";
import { useState } from "react";
import {
  Bot, Zap, MessageCircle, BarChart3, Shield, Clock,
  CheckCircle, ArrowRight, Star, ChevronDown, Menu, X,
  Sparkles, Users, TrendingUp, Building2, Phone
} from "lucide-react";

const PLANS = [
  {
    id: "basico",
    name: "Básico",
    price: 30000,
    badge: null,
    color: "border-white/10",
    btnColor: "bg-white/10 hover:bg-white/15 text-white",
    features: [
      "Agente IA en WhatsApp 24/7",
      "Respuestas automáticas ilimitadas",
      "Panel de inbox en tiempo real",
      "Modo humano (tomar el control)",
      "Editor de personalidad IA",
      "Integración con Odoo",
      "Hasta 500 conversaciones/mes",
      "1 número de WhatsApp",
    ],
    missing: ["Campañas masivas", "Múltiples agentes", "Reportes avanzados"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 60000,
    badge: "🔥 Lanzamiento",
    color: "border-emerald-500/40",
    btnColor: "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-900/30",
    features: [
      "Todo lo del plan Básico",
      "Campañas masivas de WhatsApp",
      "Hasta 3 agentes humanos",
      "Reportes avanzados de conversión",
      "Conversaciones ilimitadas",
      "Soporte prioritario",
      "Integraciones personalizadas",
      "Webhook a tus propios sistemas",
    ],
    missing: [],
  },
];

const STEPS = [
  { n: "01", title: "Regístrate", desc: "Llena el formulario con los datos de tu negocio. En menos de 10 minutos estás activo.", icon: Building2 },
  { n: "02", title: "Conecta tu WhatsApp", desc: "Un clic para vincular tu número de WhatsApp Business a tu agente IA.", icon: MessageCircle },
  { n: "03", title: "Personaliza tu IA", desc: "Dile a tu agente cómo hablar, qué ofrecer y cuándo agendar citas.", icon: Bot },
];

const FEATURES = [
  { icon: Bot, title: "IA Conversacional", desc: "GPT-4o responde como un asesor experto de tu negocio, 24 horas al día, 7 días a la semana.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Zap, title: "Respuestas en < 3 seg", desc: "Tus clientes nunca esperan. El bot responde al instante, incluso a las 3am.", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: MessageCircle, title: "Agendamiento automático", desc: "Integración con Odoo para agendar citas directamente desde la conversación.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Users, title: "Modo Humano", desc: "Toma el control de cualquier conversación con un solo clic desde tu panel.", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: BarChart3, title: "Panel en tiempo real", desc: "Ve todos tus chats activos, métricas y el estado del bot desde un solo lugar.", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: Shield, title: "100% seguro", desc: "Tus datos y los de tus clientes protegidos con cifrado de nivel bancario.", color: "text-blue-400", bg: "bg-blue-500/10" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-white font-sans overflow-x-hidden">

      {/* ── Ambient glow ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* ── NAV ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070a10]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">NODIA</span>
            <span className="hidden sm:block text-xs text-white/30 font-medium border border-white/10 px-2 py-0.5 rounded-full">IA para WhatsApp</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[["Funciones","funciones"],["Calculadora","calculadora"],["Precios","precios"],["Cómo funciona","pasos"]].map(([l,id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm text-white/50 hover:text-white font-medium transition-colors">{l}</button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => scrollTo("registro")}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30">
              Empezar gratis <ArrowRight size={15} />
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white/50">
              {menuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0a0d14] border-t border-white/5 px-6 py-4 space-y-3">
            {[["Funciones","funciones"],["Precios","precios"],["Cómo funciona","pasos"]].map(([l,id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block text-sm text-white/60 hover:text-white">{l}</button>
            ))}
            <button onClick={() => scrollTo("registro")}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm rounded-xl mt-2">
              Empezar ahora
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-8">
          <Sparkles size={12} /> Lanzamiento especial — 60% de descuento primer mes
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
          Tu negocio vendiendo<br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            mientras duermes
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
          Un agente de IA que atiende a tus clientes por WhatsApp, agenda citas, consulta Odoo y cierra ventas —
          <strong className="text-white/60"> sin que tú hagas nada.</strong>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => scrollTo("registro")}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-base rounded-2xl transition-all shadow-2xl shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5">
            Activar mi agente IA <ArrowRight size={18} />
          </button>
          <a href="https://wa.me/573001234567?text=Hola%2C%20quiero%20ver%20una%20demo%20de%20NODIA"
            target="_blank"
            className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base rounded-2xl transition-all">
            <MessageCircle size={18} className="text-[#25D366]" /> Ver demo en vivo
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-12 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["CB","AR","ML","JP"].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 border-2 border-[#070a10] flex items-center justify-center text-white text-[10px] font-bold">{i}</div>
              ))}
            </div>
            <span>+20 negocios activos</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            {[...Array(5)].map((_,i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400"/>)}
            <span className="ml-1">4.9/5</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="funciones" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Todo lo que necesitas</h2>
            <p className="text-white/40 mt-3 max-w-xl mx-auto">Un sistema completo de atención al cliente con IA, diseñado para negocios colombianos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all hover:-translate-y-1">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="pasos" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-3">Proceso</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Listo en 10 minutos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc, icon: Icon }) => (
              <div key={n} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <Icon size={26} className="text-emerald-400" />
                </div>
                <span className="text-4xl font-extrabold text-white/5 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 select-none">{n}</span>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────── */}
      <section id="calculadora" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">Calculadora de ROI</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">¿Cuánto dinero estás perdiendo sin IA?</h2>
            <p className="text-white/40 mt-3">Calcula el retorno de inversión real para tu negocio</p>
          </div>
          <ROICalculator onCalculated={() => scrollTo("registro")} />
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="precios" className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">Precios</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Sin sorpresas</h2>
            <p className="text-white/40 mt-3">Cancela cuando quieras. Sin permanencia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map(plan => (
              <div key={plan.id} className={`relative bg-white/[0.02] border-2 ${plan.color} rounded-3xl p-8 ${plan.id === "pro" ? "shadow-2xl shadow-emerald-900/20" : ""}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-extrabold text-white text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-white">${(plan.price/1000).toFixed(0)}k</span>
                    <span className="text-white/30 mb-1">COP / mes</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/20 line-through">
                      <X size={16} className="shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => { setSelectedPlan(plan.id); scrollTo("registro"); }}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${plan.btnColor}`}>
                  Empezar con {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRO ─────────────────────────────────── */}
      <section id="registro" className="relative py-24 px-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-3">Registro</p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Activa tu agente hoy</h2>
            <p className="text-white/40 mt-3 text-sm">Un asesor de NODIA te contactará en máximo 2 horas.</p>
          </div>

          <RegisterForm selectedPlan={selectedPlan} />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="font-extrabold text-white">NODIA</span>
        </div>
        <p className="text-xs text-white/20">© 2024 NODIA SaaS · Agentes IA para WhatsApp · Colombia</p>
      </footer>
    </div>
  );
}

// ─── FORMULARIO ───────────────────────────────────────────────────────────────
function RegisterForm({ selectedPlan }: { selectedPlan: string }) {
  const [form, setForm] = useState({ nombre: "", contacto: "", whatsapp: "", email: "", plan: selectedPlan, negocio: "" });
  const [status, setStatus] = useState<"idle"|"sending"|"done"|"error">("idle");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      // Enviar a WhatsApp de NODIA
      const msg = encodeURIComponent(
        `🆕 *Nuevo registro NODIA*\n\n` +
        `📌 Negocio: ${form.nombre}\n` +
        `👤 Contacto: ${form.contacto}\n` +
        `📱 WhatsApp: ${form.whatsapp}\n` +
        `📧 Email: ${form.email}\n` +
        `💼 Plan: ${form.plan}\n` +
        `🏪 Tipo negocio: ${form.negocio}`
      );
      window.open(`https://wa.me/573001234567?text=${msg}`, "_blank");
      setStatus("done");
    } catch { setStatus("error"); }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all";

  if (status === "done") return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>
      <h3 className="text-xl font-extrabold text-white mb-2">¡Solicitud enviada!</h3>
      <p className="text-white/50 text-sm">Un asesor de NODIA te contactará en WhatsApp en menos de 2 horas.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Nombre del negocio *</label>
          <input required className={inputClass} placeholder="Ej. Barbería El Estilo" value={form.nombre} onChange={set("nombre")} />
        </div>
        <div>
          <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Tipo de negocio</label>
          <input className={inputClass} placeholder="Ej. Barbería, Restaurante" value={form.negocio} onChange={set("negocio")} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Tu nombre *</label>
        <input required className={inputClass} placeholder="Nombre del dueño o encargado" value={form.contacto} onChange={set("contacto")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">WhatsApp *</label>
          <input required className={inputClass} placeholder="+57 300 000 0000" value={form.whatsapp} onChange={set("whatsapp")} />
        </div>
        <div>
          <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Email</label>
          <input type="email" className={inputClass} placeholder="correo@negocio.com" value={form.email} onChange={set("email")} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/30 mb-1.5 font-semibold uppercase tracking-wider">Plan de interés</label>
        <select className={inputClass + " cursor-pointer"} value={form.plan} onChange={set("plan")}>
          <option value="basico">Básico — $30.000/mes</option>
          <option value="pro">Pro — $60.000/mes 🔥 Lanzamiento</option>
        </select>
      </div>
      <button type="submit" disabled={status === "sending"}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
        {status === "sending" ? "Enviando..." : <><Zap size={16}/>Activar mi agente IA</>}
      </button>
      <p className="text-center text-xs text-white/20">Sin permanencia · Cancela cuando quieras · Setup incluido</p>
    </form>
  );
}

// ─── ROI CALCULATOR ────────────────────────────────────────────────────────────
function ROICalculator({ onCalculated }: { onCalculated: () => void }) {
  const [chats, setChats] = useState(30);
  const [ticket, setTicket] = useState(50000);
  const [conv, setConv] = useState(20);
  const [calculated, setCalculated] = useState(false);

  const chatsMonth = chats * 30;
  const currentRevenue = Math.round(chatsMonth * (conv / 100) * ticket);
  const aiConvRate = Math.min(conv + 15, 80);
  const aiChats = Math.round(chatsMonth * 1.25);
  const aiRevenue = Math.round(aiChats * (aiConvRate / 100) * ticket);
  const gain = aiRevenue - currentRevenue;
  const nodiaCost = 60000;
  const humanCost = 1300000;
  const roi = Math.round(((gain - nodiaCost) / nodiaCost) * 100);

  const fmt = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  const sliderClass = "w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 space-y-8">
        {[
          { label: "Chats diarios recibidos", val: chats, min: 5, max: 200, step: 1, set: setChats, fmt: (v: number) => `${v}`, unit: "/día" },
          { label: "Ticket promedio por venta", val: ticket, min: 10000, max: 500000, step: 5000, set: setTicket, fmt, unit: "" },
          { label: "Tasa de conversión actual", val: conv, min: 5, max: 60, step: 1, set: setConv, fmt: (v: number) => `${v}%`, unit: "" },
        ].map(({ label, val, min, max, step, set, fmt: f, unit }) => (
          <div key={label}>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-bold text-white">{label}</label>
              <span className="text-emerald-400 font-extrabold text-lg">{f(val)}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(+e.target.value)} className={sliderClass} />
          </div>
        ))}

        <button onClick={() => setCalculated(true)}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
          <TrendingUp size={18} /> Calcular mi ganancia con IA
        </button>
      </div>

      {/* Results */}
      <div className={`space-y-4 transition-all duration-700 ${calculated ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4 pointer-events-none"}`}>
        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-4">Comparativa mensual</p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/50">Sin IA (hoy)</span>
                <span className="text-white font-bold">{fmt(currentRevenue)}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-white/20 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((currentRevenue / aiRevenue) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-emerald-400 font-semibold">Con NODIA IA</span>
                <span className="text-emerald-400 font-extrabold">{fmt(aiRevenue)}</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-emerald-400">{fmt(gain)}</p>
            <p className="text-xs text-white/40 mt-1 font-semibold uppercase tracking-wider">Extra al mes</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
            <p className="text-2xl font-extrabold text-amber-400">{roi > 0 ? roi : 0}%</p>
            <p className="text-xs text-white/40 mt-1 font-semibold uppercase tracking-wider">ROI sobre NODIA</p>
          </div>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
          <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-3">vs Contratar un asesor humano</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Asesor tiempo completo</span>
              <span className="text-rose-400 font-bold line-through">{fmt(humanCost)}/mes</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">NODIA IA 24/7</span>
              <span className="text-emerald-400 font-bold">{fmt(nodiaCost)}/mes</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold">
              <span className="text-white/60">Ahorro mensual</span>
              <span className="text-emerald-400">{fmt(humanCost - nodiaCost)}</span>
            </div>
          </div>
        </div>

        {calculated && (
          <button onClick={onCalculated}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30">
            <ArrowRight size={16} /> Quiero ganar {fmt(gain)} más al mes
          </button>
        )}
      </div>
    </div>
  );
}
