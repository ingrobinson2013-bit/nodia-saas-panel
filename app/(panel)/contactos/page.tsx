"use client";

import { useState, useEffect } from "react";
import { getChatSessions } from "@/lib/api";
import { getTenantId, getTenantNombre } from "@/lib/tenant";
import { ChatSession } from "@/lib/types";
import Link from "next/link";
import {
  Users, Search, Download, MessageSquare, Phone, CalendarCheck, Bot, UserCheck,
  RefreshCw, Filter, Sparkles, ChevronRight, CheckCircle2
} from "lucide-react";

export default function ContactosPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [tenantNombre, setTenantNombre] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "booked" | "ai" | "human">("all");

  const loadData = async (tid?: string) => {
    const activeTid = tid || tenantId;
    if (!activeTid) return;
    setLoading(true);

    const loaded = await getChatSessions(activeTid, 100);
    setSessions(loaded);
    setLoading(false);
  };

  useEffect(() => {
    const tid = getTenantId();
    const tnom = getTenantNombre();
    setTenantId(tid);
    setTenantNombre(tnom || "Mi Negocio");
    loadData(tid);
  }, []);

  const withTenant = (href: string) => tenantId ? `${href}?tenant=${tenantId}` : href;

  // Filter contacts based on search and selected tab
  const filtered = sessions.filter(s => {
    const nameMatch = (s.name || "").toLowerCase().includes(search.toLowerCase());
    const phoneMatch = (s.wa_from || "").includes(search);
    const textMatch = nameMatch || phoneMatch;

    if (!textMatch) return false;

    const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));

    if (filterMode === "booked") return hasBooking;
    if (filterMode === "ai") return s.bot_mode;
    if (filterMode === "human") return !s.bot_mode;
    return true;
  });

  // Export to CSV functionality
  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert("No hay contactos para exportar.");
      return;
    }

    const headers = ["Nombre", "WhatsApp", "Modo Atención", "Cita Agendada", "Última Interacción"];
    const rows = filtered.map(s => {
      const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));
      return [
        `"${s.name || "Cliente WhatsApp"}"`,
        `"${s.wa_from}"`,
        `"${s.bot_mode ? "Agente IA" : "Modo Humano"}"`,
        `"${hasBooking ? "Sí" : "No"}"`,
        `"${new Date(s.updated_at).toLocaleString('es-CO')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `contactos_${tenantNombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBooked = sessions.filter(s => s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"))).length;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 p-4 md:p-8 space-y-6">
      
      {/* ── HEADER PRINCIPAL CRM ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1527] via-[#091122] to-[#060913] border border-amber-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Users size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                CRM de Contactos & Leads
              </h1>
              <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
                {tenantNombre}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Directorio inteligente de clientes capturados por WhatsApp con sincronización Odoo
            </p>
          </div>
        </div>

        {/* Acciones e Integración CSV */}
        <div className="relative z-10 flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold transition-all duration-200 shadow-lg shadow-amber-500/5 active:scale-95"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-amber-400 transition-all duration-200"
            title="Refrescar lista"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-amber-400" : ""} />
          </button>
        </div>
      </div>

      {/* ── BÚSQUEDA Y FILTROS RÁPIDOS ── */}
      <div className="card-luxury p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Input de Búsqueda */}
        <div className="flex items-center gap-3 bg-[#070a14] border border-white/10 focus-within:border-amber-500/40 rounded-xl px-4 py-2.5 w-full md:w-96 transition-all">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o número de WhatsApp..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-400 outline-none w-full font-medium"
          />
        </div>

        {/* Tabs de Filtro */}
        <div className="flex bg-[#070a14] border border-white/10 p-1 rounded-xl text-xs font-bold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterMode === "all" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
            }`}
          >
            Todos ({sessions.length})
          </button>
          <button
            onClick={() => setFilterMode("booked")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterMode === "booked" ? "bg-emerald-500 text-white font-black" : "text-slate-400 hover:text-emerald-400"
            }`}
          >
            <CalendarCheck size={12} /> Con Cita ({totalBooked})
          </button>
          <button
            onClick={() => setFilterMode("ai")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterMode === "ai" ? "bg-cyan-500 text-slate-950 font-black" : "text-slate-400 hover:text-cyan-400"
            }`}
          >
            <Bot size={12} /> Atendidos IA ({sessions.filter(s=>s.bot_mode).length})
          </button>
          <button
            onClick={() => setFilterMode("human")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterMode === "human" ? "bg-violet-500 text-white font-black" : "text-slate-400 hover:text-violet-400"
            }`}
          >
            <UserCheck size={12} /> Modo Humano ({sessions.filter(s=>!s.bot_mode).length})
          </button>
        </div>
      </div>

      {/* ── TABLA DE CONTACTOS ── */}
      <div className="card-luxury rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#070a14] text-slate-400 font-extrabold uppercase tracking-wider border-b border-white/5">
                <th className="p-4 pl-6">Cliente</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4">Atención</th>
                <th className="p-4">Estado Cita</th>
                <th className="p-4">Última Actividad</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin text-amber-400 mx-auto mb-2" />
                    <span>Cargando directorio de contactos...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Users size={32} className="text-slate-400/40 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-300">No se encontraron contactos</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando el término de búsqueda o filtro.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const initial = (s.name || s.wa_from || "C").charAt(0).toUpperCase();
                  const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));
                  const formattedTime = new Date(s.updated_at).toLocaleString("es-CO", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                  });

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors duration-150 group">
                      {/* Cliente */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-xs text-slate-950 shadow-md">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs group-hover:text-amber-300 transition-colors">
                              {s.name || "Cliente WhatsApp"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="p-4 font-mono font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>+{s.wa_from}</span>
                        </div>
                      </td>

                      {/* Atención */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          s.bot_mode
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                        }`}>
                          {s.bot_mode ? <><Bot size={11} /> IA Autónoma</> : <><UserCheck size={11} /> Agente Humano</>}
                        </span>
                      </td>

                      {/* Estado Cita */}
                      <td className="p-4">
                        {hasBooking ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Cita Registrada
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Prospecto</span>
                        )}
                      </td>

                      {/* Última Actividad */}
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {formattedTime}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 pr-6 text-right">
                        <Link
                          href={withTenant(`/inbox`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] transition-all duration-200 group-hover:shadow-md"
                        >
                          <MessageSquare size={13} />
                          <span>Abrir Chat</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

