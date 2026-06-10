"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Users, Crown, TrendingUp, MessageCircle,
  RefreshCw, LogOut, ToggleLeft, ToggleRight, Search,
  CheckCircle2, XCircle, Bot, Zap, ArrowUpRight,
  Activity, DollarSign, Star, ChevronUp, ChevronDown, Plus
} from "lucide-react";

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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"nombre" | "created_at" | "plan">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterPlan, setFilterPlan] = useState<"" | "basico" | "pro">("");
  const [filterStatus, setFilterStatus] = useState<"" | "activo" | "inactivo">("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  useEffect(() => { if (authed) fetchTenants(); }, [authed, fetchTenants]);

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
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nodia2024")) {
      setAuthed(true); setAuthError("");
    } else {
      setAuthError("Contraseña incorrecta");
    }
  };

  const updateTenant = async (tenant_id: string, fields: Partial<Tenant>) => {
    setSaving(tenant_id);
    await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET || "nodia_admin_2024" },
      body: JSON.stringify({ tenant_id, ...fields }),
    });
    setTenants(prev => prev.map(t => t.tenant_id === tenant_id ? { ...t, ...fields } : t));
    setSaving(null);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = tenants
    .filter(t => (t.nombre + t.wa_phone_id).toLowerCase().includes(search.toLowerCase()))
    .filter(t => !filterPlan || t.plan === filterPlan)
    .filter(t => !filterStatus || (filterStatus === "activo" ? t.activo : !t.activo))
    .sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortBy === "nombre") return mult * a.nombre.localeCompare(b.nombre);
      if (sortBy === "plan") return mult * a.plan.localeCompare(b.plan);
      return mult * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

  const revenue = tenants.filter(t => t.activo).reduce((sum, t) => sum + PLANS[t.plan].price, 0);
  const stats = {
    total: tenants.length,
    activos: tenants.filter(t => t.activo).length,
    pro: tenants.filter(t => t.plan === "pro").length,
    revenue,
  };

  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarColor = (name: string) => {
    const colors = ["from-cyan-500 to-blue-600","from-violet-500 to-purple-600","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
    return colors[name.charCodeAt(0) % colors.length];
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
          <h1 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">NODIA Admin</h1>
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
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">NODIA Admin</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs text-white/30 font-medium">{stats.activos} clientes activos ahora</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-900/20">
              <Plus size={16} />
              Agregar Cliente
            </button>
            <button onClick={fetchTenants}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 text-white/50 hover:text-white text-sm font-semibold transition-all">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
            <button onClick={() => setAuthed(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/10 text-rose-400 text-sm font-semibold transition-all">
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
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
        <div className="flex items-center gap-3 mb-5">
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
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-white/50 font-mono text-xs">{t.wa_phone_id}</span>
                      </div>
                    ) : (
                      <span className="text-white/20 text-xs italic">Sin conectar</span>
                    )}
                  </td>

                  {/* Plan */}
                  <td className="py-4 px-5">
                    <button
                      onClick={() => updateTenant(t.tenant_id, { plan: t.plan === "pro" ? "basico" : "pro" })}
                      disabled={saving === t.tenant_id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${
                        t.plan === "pro"
                          ? "bg-amber-500/15 border-amber-500/20 text-amber-400 hover:bg-amber-500/25"
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
                      }`}
                    >
                      {t.plan === "pro" && <Crown size={11} />}
                      {PLANS[t.plan].label}
                      <span className="opacity-50 font-normal">${(PLANS[t.plan].price/1000).toFixed(0)}k</span>
                    </button>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-5">
                    <button
                      onClick={() => updateTenant(t.tenant_id, { activo: !t.activo })}
                      disabled={saving === t.tenant_id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        saving === t.tenant_id ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                      } ${
                        t.activo
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400"
                      }`}
                    >
                      {t.activo ? <><ToggleRight size={14} />Activo</> : <><ToggleLeft size={14} />Inactivo</>}
                    </button>
                  </td>

                  {/* Fecha */}
                  <td className="py-4 px-5">
                    <p className="text-white/40 text-xs">{new Date(t.created_at).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" })}</p>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-5 text-right flex items-center justify-end gap-2">
                    <button onClick={() => copyMagicLink(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/10 hover:border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all">
                      {copiedId === t.tenant_id ? "¡Copiado!" : "Copiar Link"}
                    </button>
                    <button onClick={() => selectLocalTenant(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/10 hover:border-violet-500/20 text-violet-400 text-xs font-bold transition-all">
                      Configurar local
                    </button>
                    <a href={`/inbox?tenant=${t.tenant_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/20 text-white/30 hover:text-cyan-400 text-xs font-semibold transition-all">
                      Ver chats <ArrowUpRight size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-white/20">
                Revenue estimado de {filtered.length} clientes: <span className="text-white/50 font-bold">
                  ${filtered.filter(t=>t.activo).reduce((s,t)=>s+PLANS[t.plan].price,0).toLocaleString("es-CO")} COP/mes
                </span>
              </p>
              <p className="text-xs text-white/20">{stats.total} tenants registrados en total</p>
            </div>
          )}
        </div>

        {/* MODAL AGREGAR TENANT */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f121d] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Plus className="text-violet-400" size={20} />
                Agregar Nuevo Cliente (Tenant)
              </h2>
              <p className="text-white/40 text-xs mb-6">
                Registra un nuevo negocio y su integración con Odoo. Los tokens de WhatsApp se configurarán después desde el panel.
              </p>
              
              <form onSubmit={handleAddTenant} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Nombre del negocio</label>
                  <input
                    className="w-full bg-[#070a10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                    placeholder="Ej. Barbería El Barón"
                    value={newTenant.nombre}
                    onChange={e => setNewTenant(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold">URL de Odoo</label>
                    <input
                      className="w-full bg-[#070a10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                      placeholder="Ej. https://elbaron.odoo.com"
                      value={newTenant.odoo_url}
                      onChange={e => setNewTenant(prev => ({ ...prev, odoo_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Base de Datos Odoo</label>
                    <input
                      className="w-full bg-[#070a10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                      placeholder="db-name"
                      value={newTenant.odoo_db}
                      onChange={e => setNewTenant(prev => ({ ...prev, odoo_db: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold">Usuario Admin Odoo</label>
                    <input
                      className="w-full bg-[#070a10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                      placeholder="admin@correo.com"
                      value={newTenant.odoo_user}
                      onChange={e => setNewTenant(prev => ({ ...prev, odoo_user: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-white/30 uppercase tracking-wider mb-1.5 font-semibold">API Key Odoo</label>
                  <input
                    type="password"
                    className="w-full bg-[#070a10] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                    placeholder="ApiKeyGeneradaEnOdoo"
                    value={newTenant.odoo_api_key}
                    onChange={e => setNewTenant(prev => ({ ...prev, odoo_api_key: e.target.value }))}
                  />
                </div>

                {addError && (
                  <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-rose-400 text-xs">
                    <XCircle size={14} /> {addError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white/60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                  >
                    {addLoading ? "Creando..." : "Crear Cliente"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
