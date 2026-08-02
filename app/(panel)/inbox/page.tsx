"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatSession } from "@/lib/types";
import {
  MessageSquare, Bot, User, Send, Search, RefreshCw, Zap, Clock,
  Sparkles, Phone, Shield, UserCheck, CalendarCheck, CheckCheck,
  Flame, DollarSign, FileText, ChevronRight, FileCheck, Layers,
  ExternalLink, Tag, MapPin, UserPlus, CheckCircle2, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { getTenantId } from "@/lib/tenant";

export default function InboxPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [active, setActive] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");
  const [agentMsg, setAgentMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState<"crm" | "timeline">("crm");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from Supabase
  const fetchSessions = async (tid?: string) => {
    const activeTid = tid || tenantId;
    if (!activeTid) return;
    setLoading(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("tenant_id", activeTid)
      .not("estado", "in", "(archivado,cerrado)")
      .order("updated_at", { ascending: false });

    const loadedSessions = (data as ChatSession[]) || [];
    setSessions(loadedSessions);

    if (!active && loadedSessions.length > 0) {
      setActive(loadedSessions[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tid = getTenantId();
    setTenantId(tid);
    fetchSessions(tid);
  }, []);

  // Supabase Realtime channel subscription
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel("chat_sessions_linear_crm")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chat_sessions",
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        const updated = payload.new as ChatSession;
        setSessions(prev => {
          const idx = prev.findIndex(s => s.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
        if (active?.id === updated.id) {
          setActive(updated);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [active, tenantId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.history?.length]);

  const toggleBotMode = async (session: ChatSession) => {
    const newMode = !session.bot_mode;
    await supabase.from("chat_sessions")
      .update({ bot_mode: newMode })
      .eq("id", session.id);
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, bot_mode: newMode } : s));
    if (active?.id === session.id) setActive({ ...session, bot_mode: newMode });
  };

  const sendAgentMessage = async (overrideText?: string) => {
    const text = overrideText || agentMsg.trim();
    if (!text || !active || !tenantId || sendingMsg) return;
    if (!overrideText) setAgentMsg("");
    setSendingMsg(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/send-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            wa_to: active.wa_from,
            message: text,
            session_id: active.id,
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      alert("Error enviando mensaje por WhatsApp Meta API.");
    } finally {
      setSendingMsg(false);
    }
  };

  const filtered = sessions.filter(s =>
    (s.name || s.wa_from).toLowerCase().includes(search.toLowerCase())
  );

  const getLastMsg = (s: ChatSession) => {
    const h = s.history || [];
    return h.length > 0 ? h[h.length - 1].content : "Sin mensajes aún";
  };

  const formatTime = (dt: string) => {
    try {
      const d = new Date(dt);
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Helper status dots & tags
  const getStatusDot = (s: ChatSession) => {
    if (s.bot_mode) return { dot: "bg-cyan-400", label: "IA Atendiendo", badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    if ((s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"))) {
      return { dot: "bg-emerald-400", label: "Cita Agendada", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    }
    const lastMsg = (s.history || [])[(s.history || []).length - 1];
    if (lastMsg && lastMsg.role === "user") {
      return { dot: "bg-orange-400 animate-pulse", label: "Esperando Respuesta", badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" };
    }
    return { dot: "bg-slate-400", label: "Modo Humano", badgeClass: "bg-slate-500/10 text-slate-300 border-slate-500/20" };
  };

  // Quick Action Handler
  const handleQuickAction = (action: string) => {
    if (!active) return;
    if (action === "phone") {
      window.open(`tel:+${active.wa_from}`, "_self");
    } else if (action === "quote") {
      sendAgentMessage(`Hola ${active.name || 'estimado cliente'}, adjunto la cotización oficial del plan seleccionado para tu negocio.`);
    } else if (action === "pdf") {
      sendAgentMessage(`Te compartimos el dossier en PDF de BeautySync Pro con los detalles del agendamiento y servicios.`);
    } else if (action === "odoo") {
      sendAgentMessage(`He iniciado el agendamiento en Odoo para tu cita. ¿En qué horario prefieres?`);
    }
  };

  // Mini Dashboard metrics
  const totalCount = sessions.length;
  const aiCount = sessions.filter(s => s.bot_mode).length;
  const humanCount = totalCount - aiCount;
  const waitingCount = sessions.filter(s => {
    const last = (s.history || [])[(s.history || []).length - 1];
    return last && last.role === "user" && !s.bot_mode;
  }).length;

  return (
    <div className="flex h-[100dvh] bg-[#07090e] text-white font-sans antialiased overflow-hidden select-none">

      {/* ══════════════════════════════════════
          COLUMNA 1: LISTA DE CONVERSACIONES & MINI DASHBOARD (340px)
      ══════════════════════════════════════ */}
      <div className="w-full md:w-[340px] flex flex-col shrink-0 border-r border-white/5 bg-[#0a0d15]">
        
        {/* 10. Dashboard Superior Compacto */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#0d121f]/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-bold mb-2">
            <span className="text-slate-300 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" /> Control CRM
            </span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-extrabold border border-emerald-500/20">
              Ventas: $3.4M
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-white/5">
              <p className="text-slate-400">Chats</p>
              <p className="font-extrabold text-white text-xs mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-cyan-500/20">
              <p className="text-cyan-400 font-bold">IA</p>
              <p className="font-extrabold text-cyan-300 text-xs mt-0.5">{aiCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-slate-500/20">
              <p className="text-slate-400">Humano</p>
              <p className="font-extrabold text-slate-200 text-xs mt-0.5">{humanCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-orange-500/20">
              <p className="text-orange-400 font-bold">Esperando</p>
              <p className="font-extrabold text-orange-300 text-xs mt-0.5">{waitingCount}</p>
            </div>
          </div>
        </div>

        {/* Header & Search Bar */}
        <div className="p-3 border-b border-white/5 bg-[#07090e]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">Conversaciones</h2>
            <button
              onClick={() => fetchSessions()}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-all"
              title="Refrescar chats"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-cyan-400" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-[#0d121f] border border-white/10 focus-within:border-cyan-500/40 transition-all">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-xs text-white placeholder-slate-400 outline-none flex-1 font-medium"
              placeholder="Buscar por cliente o WhatsApp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Chats Rediseñada */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
              <RefreshCw size={18} className="animate-spin text-cyan-400" />
              <span>Cargando conversaciones...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs text-center p-4">
              <MessageSquare size={26} className="text-slate-400/30" />
              <p className="font-bold text-slate-300">No hay chats activos</p>
            </div>
          ) : filtered.map(s => {
            const isActive = active?.id === s.id;
            const statusInfo = getStatusDot(s);
            const initial = (s.name || s.wa_from || 'C').charAt(0).toUpperCase();
            const lastMsg = getLastMsg(s);
            const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));
            const isHotLead = hasBooking || (s.history || []).length > 6;

            return (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={`w-full text-left rounded-xl transition-all duration-150 p-3 group relative border ${
                  isActive
                    ? 'bg-[#151c2d] border-white/15 text-white shadow-md'
                    : 'bg-transparent border-transparent hover:bg-white/[0.04] text-slate-300'
                }`}
              >
                {/* Top Row: Name + Dot + Time */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
                    <span className={`font-bold text-xs truncate ${isActive ? 'text-white font-extrabold' : 'text-slate-200'}`}>
                      {s.name || s.wa_from}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                    {formatTime(s.updated_at)}
                  </span>
                </div>

                {/* Subtitle: Category & Attention Status */}
                <p className="text-[10.5px] text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <span className="text-cyan-400 font-semibold">Barbería</span>
                  <span>•</span>
                  <span>{statusInfo.label}</span>
                </p>

                {/* Snippet */}
                <p className="text-[11px] text-slate-400 truncate leading-snug mb-2 font-normal">
                  &quot;{lastMsg}&quot;
                </p>

                {/* Badges de Estado (Lead Caliente, Premium, IA Score) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {isHotLead && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      <Flame size={9} /> Lead Caliente
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/15 text-amber-300 border border-amber-400/20">
                    💰 $1.2M
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                    87% Score
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
          COLUMNA 2: WORKSPACE DE CHAT & IA (FLEX-1)
      ══════════════════════════════════════ */}
      {active ? (
        <div className="flex-1 flex flex-col bg-[#07090e] min-w-0">
          
          {/* 7. Header de Conversación Enriquecido & Funnel Progress */}
          <div className="px-5 py-3 border-b border-white/5 bg-[#0b0f19]/90 backdrop-blur-md flex flex-col gap-2 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xs text-white shadow-md">
                  {(active.name || active.wa_from).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm text-white">{active.name || active.wa_from}</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Barbería & Spa
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10.5px] text-slate-400 font-mono mt-0.5">
                    <span>Cliente desde: Mayo 2026</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">Valor Esperado: $1,200,000 COP</span>
                  </div>
                </div>
              </div>

              {/* Toggle IA Button */}
              <button
                onClick={() => toggleBotMode(active)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  active.bot_mode
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                }`}
              >
                {active.bot_mode ? <Bot size={14} /> : <UserCheck size={14} />}
                <span>{active.bot_mode ? "IA Respondiendo" : "Modo Humano"}</span>
              </button>
            </div>

            {/* 9. Barra de Progreso del Embudo */}
            <div className="flex items-center gap-3 bg-[#07090e] px-3 py-1.5 rounded-lg border border-white/5 text-[10.5px]">
              <span className="font-bold text-slate-300 shrink-0">Paso 4 de 6: Cotización Enviada</span>
              <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: "66%" }} />
              </div>
              <span className="text-cyan-400 font-bold shrink-0">66%</span>
            </div>

            {/* 11. Acciones Rápidas (Barra de Botones) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleQuickAction("phone")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold border border-white/5 transition-all"
              >
                <Phone size={12} className="text-cyan-400" /> Llamar
              </button>
              <button
                onClick={() => handleQuickAction("odoo")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 transition-all"
              >
                <CalendarCheck size={12} /> Agendar Odoo
              </button>
              <button
                onClick={() => handleQuickAction("quote")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/20 transition-all"
              >
                <DollarSign size={12} /> Cotizar
              </button>
              <button
                onClick={() => handleQuickAction("pdf")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/20 transition-all"
              >
                <FileText size={12} /> Enviar Dossier PDF
              </button>
            </div>
          </div>

          {/* 2. Banner de Resumen IA (Collapsible) */}
          <div className="mx-5 mt-4 bg-[#0d121f] border border-cyan-500/20 rounded-2xl p-4 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
                <Sparkles size={14} />
                <span>RESUMEN IA INTELIGENTE</span>
              </div>
              <button
                onClick={() => setShowAiSummary(!showAiSummary)}
                className="text-slate-400 hover:text-white p-1"
              >
                {showAiSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showAiSummary && (
              <div className="space-y-2 text-xs pt-1 animate-fade-in">
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-medium">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Barbería de 3 sillas
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Invierte $800K COP/mes
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Interesado en Software + Odoo
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Quiere demostración hoy
                  </p>
                </div>

                <div className="bg-[#07090e] p-2.5 rounded-xl border border-cyan-500/20 flex items-center justify-between mt-2">
                  <div className="text-[11px]">
                    <span className="text-slate-400">Siguiente Acción Sugerida: </span>
                    <strong className="text-cyan-300">➡ Enviar demostración Plan PRO con agendamiento</strong>
                  </div>
                  <button
                    onClick={() => sendAgentMessage("Hola! Te compartimos el enlace para la demostración en vivo del Plan PRO: https://beautysyncpro.com/demo")}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] shrink-0"
                  >
                    Ejecutar 1-Clic
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Mensajes Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 relative">
            {(active.history || []).map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${
                    isUser
                      ? "bg-[#0e1726] border border-white/10 text-slate-200 rounded-tl-none"
                      : msg.role === "agent"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-tr-none"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                  }`}>
                    {!isUser && (
                      <div className="flex items-center gap-1 mb-1 text-[9px] font-black uppercase tracking-wider opacity-85">
                        {msg.role === "agent" ? "Agente Humano" : "BeautySync IA"}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Formulario de Envió */}
          <div className="p-4 border-t border-white/5 bg-[#0b0f19]/80 backdrop-blur-md">
            {!active.bot_mode ? (
              <div className="flex items-center gap-2 bg-[#07090e] border border-white/10 focus-within:border-cyan-500/40 rounded-xl px-3.5 py-2">
                <input
                  type="text"
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                  placeholder="Escribe un mensaje al cliente..."
                  value={agentMsg}
                  onChange={e => setAgentMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendAgentMessage()}
                />
                <button
                  onClick={() => sendAgentMessage()}
                  disabled={!agentMsg.trim() || sendingMsg}
                  className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all"
                >
                  <Send size={13} />
                </button>
              </div>
            ) : (
              <div className="bg-[#07090e] border border-white/5 rounded-xl py-2.5 px-4 text-center text-slate-400 text-xs font-semibold">
                🤖 La IA está respondiendo automáticamente. Desactiva el modo IA para escribir.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ══════════════════════════════════════
          COLUMNA 3: PANEL DERECHO CRM INTELIGENTE (320px)
      ══════════════════════════════════════ */}
      {active && (
        <div className="hidden lg:flex w-[320px] flex-col shrink-0 border-l border-white/5 bg-[#0a0d15] overflow-y-auto">
          {/* Header del Panel CRM */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0d121f]">
            <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-cyan-400" /> Inteligencia CRM
            </span>
            <div className="flex bg-[#07090e] p-0.5 rounded-lg border border-white/5 text-[10px] font-bold">
              <button
                onClick={() => setActiveRightTab("crm")}
                className={`px-2.5 py-1 rounded transition-all ${
                  activeRightTab === "crm" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                }`}
              >
                CRM
              </button>
              <button
                onClick={() => setActiveRightTab("timeline")}
                className={`px-2.5 py-1 rounded transition-all ${
                  activeRightTab === "timeline" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          {activeRightTab === "crm" ? (
            <div className="p-4 space-y-4 text-xs">
              
              {/* Tarjeta Perfil Cliente */}
              <div className="bg-[#0d121f] p-4 rounded-2xl border border-white/5 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                  {(active.name || active.wa_from).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{active.name || "Cliente WhatsApp"}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">+{active.wa_from}</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold flex items-center gap-1">
                    <MapPin size={9} /> Bogotá, CO
                  </span>
                </div>
              </div>

              {/* IA Score & Heat Score */}
              <div className="bg-[#0d121f] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">IA Purchase Score</span>
                  <span className="font-extrabold text-cyan-400 font-mono text-sm">87%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full" style={{ width: "87%" }} />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="font-bold text-slate-300">Heat Score</span>
                  <span className="font-black text-rose-400 flex items-center gap-1 text-xs">
                    <Flame size={14} className="fill-rose-400" /> 🔥🔥🔥🔥 (Hot)
                  </span>
                </div>
              </div>

              {/* Embudo & Datos Financieros */}
              <div className="bg-[#0d121f] p-4 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Embudo Actual:</span>
                  <strong className="text-amber-300">Cotización (Paso 4)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor Esperado:</span>
                  <strong className="text-emerald-400 font-mono">$1,200,000 COP</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Última Compra:</span>
                  <span className="text-slate-300 font-mono">Primera Vez</span>
                </div>
              </div>

              {/* Recomendación de Siguiente Acción */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4 rounded-2xl space-y-2">
                <p className="font-extrabold text-cyan-300 flex items-center gap-1 text-[11px]">
                  <Sparkles size={12} /> RECOMENDACIÓN IA
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Cliente listo para cierre. Enviar PDF de propuesta con el enlace de pago directo.
                </p>
                <button
                  onClick={() => handleQuickAction("quote")}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md mt-1"
                >
                  Enviar Cotización en 1-Clic
                </button>
              </div>

            </div>
          ) : (
            /* Tab: Timeline de Eventos del Cliente */
            <div className="p-4 space-y-4 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Historial Cronológico</h4>
              
              <div className="relative border-l border-white/10 pl-4 space-y-4 ml-2">
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:10 AM</p>
                  <p className="font-bold text-white">Entró desde Meta Ads</p>
                  <p className="text-[10.5px] text-slate-400">Campañas Outbound Barbería</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:11 AM</p>
                  <p className="font-bold text-white">IA Respondió Saludo</p>
                  <p className="text-[10.5px] text-slate-400">Bienvenida y calificación previa</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:12 AM</p>
                  <p className="font-bold text-white">Cliente Consultó Precio</p>
                  <p className="text-[10.5px] text-slate-400">Interés en Plan PRO</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-rose-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:14 AM</p>
                  <p className="font-bold text-white">Lead Caliente Detectado</p>
                  <p className="text-[10.5px] text-slate-400">IA Score subió a 87%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


