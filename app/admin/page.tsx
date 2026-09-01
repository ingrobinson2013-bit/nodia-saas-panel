"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Users, Crown, TrendingUp, MessageCircle,
  RefreshCw, LogOut, ToggleLeft, ToggleRight, Search,
  CheckCircle2, XCircle, Bot, Zap, ArrowUpRight,
  Activity, DollarSign, Star, ChevronUp, ChevronDown, Plus,
  Cpu, Gauge, Brain, Sparkles, Clock, Database, Check, Copy, Flame
} from "lucide-react";
import { getTelemetryStats, TelemetryData, getTenants } from "@/lib/api";

interface Tenant {
  tenant_id: string;
  nombre: string;
  wa_phone_id: string;
  activo: boolean;
  plan: "basico" | "pro";
  created_at: string;
  ai_prompt?: string;
}

const PLANS: Record<string, { label: string; price: number; color: string; bg: string }> = {
  basico: { label: "Básico",  price: 30000,  color: "text-slate-300", bg: "bg-white/10" },
  pro:    { label: "Pro",     price: 60000,  color: "text-amber-400", bg: "bg-amber-500/15" },
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"telemetry" | "tenants">("telemetry");

  // Tenants State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"nombre" | "created_at" | "plan">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterPlan, setFilterPlan] = useState<"" | "basico" | "pro">("");
  const [filterStatus, setFilterStatus] = useState<"" | "activo" | "inactivo">("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [selectedTelemetryTenant, setSelectedTelemetryTenant] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Formulario nuevo tenant
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    nombre: "",
    odoo_url: "",
    odoo_db: "",
    odoo_user: "",
    odoo_api_key: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tenants", {
      headers: { "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "nodia_admin_2024" },
    });
    if (res.ok) setTenants(await res.json());
    setLoading(false);
  }, []);

  const fetchTelemetry = useCallback(async (tid?: string) => {
    setTelemetryLoading(true);
    const data = await getTelemetryStats(tid || undefined);
    if (data) {
      setTelemetry(data);
    }
    setTelemetryLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      fetchTenants();
      fetchTelemetry(selectedTelemetryTenant);
    }
  }, [authed, fetchTenants, fetchTelemetry, selectedTelemetryTenant]);

  // Polling automático para telemetría cada 6s
  useEffect(() => {
    if (!authed || !autoRefresh || activeTab !== "telemetry") return;
    const timer = setInterval(() => {
      fetchTelemetry(selectedTelemetryTenant);
    }, 6000);
    return () => clearInterval(timer);
  }, [authed, autoRefresh, activeTab, selectedTelemetryTenant, fetchTelemetry]);

  const selectLocalTenant = (t: Tenant) => {
    localStorage.setItem("nodia_tenant_id", t.tenant_id);
    localStorage.setItem("nodia_tenant_nombre", t.nombre);
    localStorage.setItem("nodia_tenant_plan", t.plan);
    window.location.href = "/config";
  };

  const copyMagicLink = (t: Tenant) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const magicUrl = `${origin}/login?magic=${t.tenant_id}`;
    navigator.clipboard.writeText(magicUrl);
    setCopiedId(t.tenant_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.nombre || !newTenant.odoo_url || !newTenant.odoo_db || !newTenant.odoo_user || !newTenant.odoo_api_key) {
      setAddError("Todos los campos son obligatorios");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "nodia_admin_2024",
        },
        body: JSON.stringify(newTenant),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear cliente");
      
      setTenants(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewTenant({ nombre: "", odoo_url: "", odoo_db: "", odoo_user: "", odoo_api_key: "" });
    } catch (err: any) {
      setAddError(err.message || "Error al crear cliente");
    } finally {
      setAddLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nodia2024";
    if (password === correctPassword) {
      setAuthed(true);
      setAuthError("");
    } else {
      setAuthError("Contraseña incorrecta");
    }
  };

  const updateTenant = async (tenant_id: string, fields: Partial<Tenant>) => {
    setSaving(tenant_id);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "nodia_admin_2024",
        },
        body: JSON.stringify({ tenant_id, ...fields }),
      });
      if (res.ok) {
        setTenants(prev => prev.map(t => t.tenant_id === tenant_id ? { ...t, ...fields } : t));
      }
    } finally {
      setSaving(null);
    }
  };

  const toggleSort = (col: "nombre" | "created_at" | "plan") => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const stats = {
    total: tenants.length,
    activos: tenants.filter(t => t.activo).length,
    pro: tenants.filter(t => t.plan === "pro").length,
  };

  const revenue = tenants.reduce((acc, t) => t.activo ? acc + (PLANS[t.plan]?.price || 0) : acc, 0);

  const filtered = tenants
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = t.nombre.toLowerCase().includes(q) || (t.wa_phone_id || "").includes(q);
      const matchPlan = !filterPlan || t.plan === filterPlan;
      const matchStatus = !filterStatus || (filterStatus === "activo" ? t.activo : !t.activo);
      return matchSearch && matchPlan && matchStatus;
    })
    .sort((a, b) => {
      let va = a[sortBy] || "";
      let vb = b[sortBy] || "";
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarColor = (name: string) => {
    const colors = ["from-cyan-500 to-blue-600","from-violet-500 to-purple-600","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "SALUDO": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "HORARIO": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "UBICACION": return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "PRECIOS": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "CONFIRMACION": return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "CORTESIA": return "bg-teal-500/15 text-teal-400 border-teal-500/30";
      default: return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const getMotorBadge = (motor: string) => {
    if (motor.startsWith("fastpath")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Zap size={10} /> Fast-Path ($0)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30">
        <Sparkles size={10} /> GPT-4o-mini
      </span>
    );
  };

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-[#070a10] flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.15),transparent_70%)]" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <ShieldCheck size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">BeautySync Pro+ Admin</h1>
          <p className="text-white/30 text-sm text-center mb-8">Panel de Control Maestro</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña de administrador"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
              autoFocus
            />
            {authError && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-xs">
                <XCircle size={14} /> {authError}
              </div>
            )}
            <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50">
              Acceder
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070a10] text-white font-sans">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                BeautySync Pro+ Admin
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Maestro
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-white/40 font-medium">PostgreSQL 17 & Fast-Path Neuronal Activo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "tenants" && (
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-900/20">
                <Plus size={16} />
                Agregar Cliente
              </button>
            )}
            <button onClick={() => { fetchTenants(); fetchTelemetry(selectedTelemetryTenant); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 text-white/50 hover:text-white text-sm font-semibold transition-all">
              <RefreshCw size={15} className={(loading || telemetryLoading) ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button onClick={() => setAuthed(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400 text-sm font-semibold transition-all">
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl mb-8 w-fit">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "telemetry"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-900/40"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Brain size={15} />
            🧠 Telemetría & ROI de IA
          </button>
          <button
            onClick={() => setActiveTab("tenants")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "tenants"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-900/40"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users size={15} />
            🏢 Gestión de Negocios ({tenants.length})
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: TELEMETRÍA Y ROI DE IA (EXCLUSIVO ADMIN)                        */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "telemetry" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Filter by Tenant Header */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Brain className="text-violet-400" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-white">Filtro de Telemetría por Negocio</h3>
                  <p className="text-xs text-white/40">Visualiza métricas globales o aisladas por cada barbería/salón</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedTelemetryTenant}
                  onChange={(e) => {
                    setSelectedTelemetryTenant(e.target.value);
                    fetchTelemetry(e.target.value);
                  }}
                  className="bg-[#0b0e17] border border-white/15 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none cursor-pointer focus:border-violet-500"
                >
                  <option value="">🌐 Todos los Negocios (Métricas Globales)</option>
                  {tenants.map(t => (
                    <option key={t.tenant_id} value={t.tenant_id}>
                      {t.nombre} ({t.plan.toUpperCase()})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    autoRefresh
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-white/5 text-white/40 border-white/10"
                  }`}
                >
                  <Activity size={12} className={autoRefresh ? "animate-pulse" : ""} />
                  {autoRefresh ? "En Vivo (6s)" : "Pausado"}
                </button>
              </div>
            </div>

            {/* Top 4 IA KPI Cards */}
            <div className="grid grid-cols-4 gap-5">
              {/* Card 1: Fast-Path Ratio */}
              <div className="relative bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/20 rounded-3xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Zap size={20} className="text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    Costo $0 USD
                  </span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  {telemetry?.metrics.fastpath_ratio || 0}%
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Tasa Fast-Path Neuronal</p>
                <p className="text-[11px] text-emerald-400/80 mt-2 font-medium">
                  {telemetry?.metrics.fastpath_count || 0} de {telemetry?.metrics.total_interactions || 0} consultas resueltas en 2ms
                </p>
              </div>

              {/* Card 2: Latency Speedup */}
              <div className="relative bg-gradient-to-br from-blue-500/10 via-white/[0.02] to-transparent border border-blue-500/20 rounded-3xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Gauge size={20} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    Ultra Baja Latencia
                  </span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  {telemetry?.metrics.avg_fastpath_ms || 2.4} <span className="text-lg font-normal text-white/40">ms</span>
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Latencia Media Fast-Path</p>
                <p className="text-[11px] text-blue-400/80 mt-2 font-medium">
                  vs {telemetry?.metrics.avg_llm_ms || 820} ms de LLM en la nube (340x más veloz)
                </p>
              </div>

              {/* Card 3: Estimated Savings */}
              <div className="relative bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent border border-amber-500/20 rounded-3xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <DollarSign size={20} className="text-amber-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    ROI Directo
                  </span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  ${telemetry?.metrics.cost_saved_usd || 0} <span className="text-sm font-normal text-white/40">USD</span>
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Ahorro en Tokens OpenAI</p>
                <p className="text-[11px] text-amber-400/80 mt-2 font-medium">
                  Preservación de margen operativo SaaS
                </p>
              </div>

              {/* Card 4: VIP Memory Profiles */}
              <div className="relative bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent border border-violet-500/20 rounded-3xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Brain size={20} className="text-violet-400" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                    Memoria Episódica
                  </span>
                </div>
                <p className="text-3xl font-black text-white tracking-tight mb-1">
                  {telemetry?.metrics.total_vip_clients || 0}
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Clientes VIP Reconocidos</p>
                <p className="text-[11px] text-violet-400/80 mt-2 font-medium">
                  Hábitos y barbero preferido cosechados
                </p>
              </div>
            </div>

            {/* Breakdown of Intents */}
            <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-6">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14} className="text-cyan-400" />
                Desglose Canónico de Intenciones Procesadas
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {Object.entries(telemetry?.metrics.breakdown || {}).map(([intent, count]) => (
                  <div key={intent} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-2 ${getIntentColor(intent)}`}>
                      {intent}
                    </span>
                    <p className="text-xl font-extrabold text-white">{count}</p>
                    <p className="text-[10px] text-white/30 font-medium mt-0.5">consultas</p>
                  </div>
                ))}
                {Object.keys(telemetry?.metrics.breakdown || {}).length === 0 && (
                  <div className="col-span-6 py-6 text-center text-xs text-white/30">
                    Aún no hay suficientes registros de intenciones para mostrar el desglose.
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Intent Audit Stream */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Intent Logs Stream */}
              <div className="col-span-2 bg-white/[0.02] border border-white/8 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <Zap size={14} className="text-amber-400" />
                    Auditoría de Inferencia en Tiempo Real (`ai_intent_logs`)
                  </h3>
                  <span className="text-[11px] text-white/30 font-mono">Últimos 25 eventos</span>
                </div>

                <div className="overflow-x-auto max-h-[420px] overflow-y-auto pr-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-white/30 uppercase text-[10px]">
                        <th className="text-left py-2 px-3">Mensaje Cliente</th>
                        <th className="text-left py-2 px-3">Intención</th>
                        <th className="text-left py-2 px-3">Motor</th>
                        <th className="text-right py-2 px-3">Latencia</th>
                        <th className="text-right py-2 px-3">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {(telemetry?.recent_logs || []).map((log: any) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-white/90 font-medium font-mono" title={log.mensaje_cliente}>
                            &quot;{log.mensaje_cliente}&quot;
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getIntentColor(log.intencion_predicha)}`}>
                              {log.intencion_predicha}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {getMotorBadge(log.motor_usado)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-400">
                            {log.latencia_ms ? `${log.latencia_ms.toFixed(1)} ms` : "< 3 ms"}
                          </td>
                          <td className="py-2.5 px-3 text-right text-white/30 font-mono text-[10px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Reciente"}
                          </td>
                        </tr>
                      ))}
                      {(telemetry?.recent_logs || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-white/30 text-xs">
                            Sin logs de auditoría en este filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Col: Top VIP Memory Profiles */}
              <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                    <Brain size={14} className="text-violet-400" />
                    Clientes VIP (`client_memory`)
                  </h3>
                  <span className="text-[11px] text-white/30 font-mono">Top Citas</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {(telemetry?.top_memory || []).map((client) => (
                    <div key={client.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-bold text-white">{client.nombre_cliente || "Cliente Recurrente"}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                          {client.total_citas_agendadas} citas
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 font-mono mb-2">{client.wa_from}</p>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {client.profesional_favorito && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-amber-300 font-semibold">
                            ✂️ {client.profesional_favorito}
                          </span>
                        )}
                        {client.horario_habitual && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-cyan-300 font-semibold">
                            ⏰ {client.horario_habitual}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(telemetry?.top_memory || []).length === 0 && (
                    <div className="py-12 text-center text-white/30 text-xs">
                      Aún no hay perfiles de clientes consolidados en memoria.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: GESTIÓN DE TENANTS / NEGOCIOS                                   */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "tenants" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-5">
              {[
                {
                  label: "Total Clientes", val: stats.total,
                  icon: Users, grad: "from-blue-500 to-cyan-500",
                  sub: `${stats.activos} activos`
                },
                {
                  label: "Plan Pro", val: stats.pro,
                  icon: Crown, grad: "from-amber-500 to-orange-500",
                  sub: `${stats.total - stats.pro} en básico`
                },
                {
                  label: "Chats IA Activos", val: stats.activos,
                  icon: Bot, grad: "from-emerald-500 to-teal-500",
                  sub: "respondiendo ahora"
                },
                {
                  label: "Revenue MRR", val: `$${(revenue/1000).toFixed(0)}k`,
                  icon: DollarSign, grad: "from-violet-500 to-purple-500",
                  sub: "COP mensual estimado"
                },
              ].map(({ label, val, icon: Icon, grad, sub }) => (
                <div key={label} className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/8 rounded-2xl p-6 overflow-hidden hover:border-white/15 transition-all hover:-translate-y-0.5">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${grad} opacity-5 rounded-full -translate-y-6 translate-x-6 group-hover:opacity-10 transition-opacity`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} bg-opacity-20 flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <p className="text-3xl font-extrabold text-white tracking-tight mb-1">{val}</p>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-white/20 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Filters + Search */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3">
                <Search size={16} className="text-white/30 shrink-0" />
                <input
                  className="bg-transparent text-sm text-white placeholder-white/25 outline-none flex-1"
                  placeholder="Buscar cliente o número..."
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value as any)}
                className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3 text-sm text-white/60 outline-none cursor-pointer">
                <option value="">Todos los planes</option>
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                className="bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3 text-sm text-white/60 outline-none cursor-pointer">
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
              <div className="text-xs text-white/25 px-3 py-3 whitespace-nowrap">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/8 rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      { col: "nombre", label: "Negocio" },
                      { col: null, label: "WhatsApp" },
                      { col: "plan", label: "Plan" },
                      { col: null, label: "Estado" },
                      { col: "created_at", label: "Registrado" },
                      { col: null, label: "" },
                    ].map(({ col, label }) => (
                      <th key={label}
                        onClick={() => col && toggleSort(col as any)}
                        className={`text-left py-4 px-5 text-xs font-bold text-white/25 uppercase tracking-wider ${col ? "cursor-pointer hover:text-white/50" : ""}`}>
                        <div className="flex items-center gap-1">
                          {label}
                          {col && sortBy === col && (
                            sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr><td colSpan={6} className="py-16 text-center text-white/25 text-sm">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw size={16} className="animate-spin" /> Cargando tenants...
                      </div>
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center text-white/20 text-sm">Sin resultados</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.tenant_id} className="group hover:bg-white/[0.02] transition-colors">
                      {/* Negocio */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(t.nombre)} flex items-center justify-center text-white text-xs font-extrabold shrink-0`}>
                            {initials(t.nombre)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{t.nombre}</p>
                            <p className="text-xs text-white/25 font-mono mt-0.5">{t.tenant_id.slice(0,8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-4 px-5">
                        {t.wa_phone_id ? (
                          <span className="font-mono text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-lg">
                            {t.wa_phone_id}
                          </span>
                        ) : (
                          <span className="text-xs text-white/20 italic">Sin conectar</span>
                        )}
                      </td>

                      {/* Plan selector */}
                      <td className="py-4 px-5">
                        <select
                          value={t.plan}
                          disabled={saving === t.tenant_id}
                          onChange={e => updateTenant(t.tenant_id, { plan: e.target.value as any })}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer transition-all border border-white/5 ${
                            t.plan === "pro" ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-slate-300"
                          }`}
                        >
                          <option value="basico" className="bg-slate-900 text-white">Básico</option>
                          <option value="pro" className="bg-slate-900 text-amber-400">Pro ⭐</option>
                        </select>
                      </td>

                      {/* Estado toggle */}
                      <td className="py-4 px-5">
                        <button
                          disabled={saving === t.tenant_id}
                          onClick={() => updateTenant(t.tenant_id, { activo: !t.activo })}
                          className={`flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1 transition-all ${
                            t.activo ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-white/30 hover:bg-white/10"
                          }`}
                        >
                          {t.activo ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {t.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* Fecha */}
                      <td className="py-4 px-5 text-xs text-white/30">
                        {new Date(t.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyMagicLink(t)}
                            title="Copiar Magic Link de Acceso"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-xs flex items-center gap-1"
                          >
                            {copiedId === t.tenant_id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => selectLocalTenant(t)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-bold transition-all border border-violet-500/20 hover:border-transparent"
                          >
                            Configurar <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modal Agregar Nuevo Tenant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-violet-400" />
                Registrar Nuevo Negocio / Tenant
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/30 hover:text-white text-sm font-bold">
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddTenant} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Nombre del Negocio</label>
                <input
                  type="text"
                  placeholder="Ej: Barbería Don Jose"
                  value={newTenant.nombre}
                  onChange={e => setNewTenant({ ...newTenant, nombre: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">URL Odoo 17 (JSON-RPC)</label>
                <input
                  type="url"
                  placeholder="https://minegocio.com"
                  value={newTenant.odoo_url}
                  onChange={e => setNewTenant({ ...newTenant, odoo_url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Base de Datos Odoo</label>
                  <input
                    type="text"
                    placeholder="db_name"
                    value={newTenant.odoo_db}
                    onChange={e => setNewTenant({ ...newTenant, odoo_db: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Usuario Odoo (Email)</label>
                  <input
                    type="text"
                    placeholder="admin@email.com"
                    value={newTenant.odoo_user}
                    onChange={e => setNewTenant({ ...newTenant, odoo_user: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">API Key de Odoo</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={newTenant.odoo_api_key}
                  onChange={e => setNewTenant({ ...newTenant, odoo_api_key: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2"
                >
                  {addLoading ? <RefreshCw size={14} className="animate-spin" /> : "Crear y Conectar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
