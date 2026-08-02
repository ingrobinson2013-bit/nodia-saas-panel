"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatSession } from "@/lib/types";
import {
  MessageSquare, Bot, User, Send, Search, RefreshCw, Zap, Clock,
  Sparkles, Phone, Shield, UserCheck, CalendarCheck, CheckCheck,
  Flame, DollarSign, FileText, ChevronRight, FileCheck, Layers,
  ExternalLink, Tag, MapPin, UserPlus, CheckCircle2, ChevronDown, ChevronUp, AlertCircle,
  Scissors, ArrowLeft, Info
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
  const [mobileView, setMobileView] = useState<"list" | "chat" | "crm">("list");
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

  // Status dot & beauty labels
  const getStatusDot = (s: ChatSession) => {
    if (s.bot_mode) return { dot: "bg-cyan-400", label: "IA Agendando", badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    if ((s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"))) {
      return { dot: "bg-emerald-400", label: "Cita Agendada", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    }
    const lastMsg = (s.history || [])[(s.history || []).length - 1];
    if (lastMsg && lastMsg.role === "user") {
      return { dot: "bg-orange-400 animate-pulse", label: "Esperando Respuesta", badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" };
    }
    return { dot: "bg-slate-400", label: "Atención Barbero", badgeClass: "bg-slate-500/10 text-slate-300 border-slate-500/20" };
  };

  // Quick Action Handler for Salons & Barbershops
  const handleQuickAction = (action: string) => {
    if (!active) return;
    if (action === "phone") {
      window.open(`tel:+${active.wa_from}`, "_self");
    } else if (action === "services") {
      sendAgentMessage(`Hola ${active.name || 'estimado cliente'}! 👋 Nuestros servicios son:\n✂️ Corte Clásico + Barba VIP: $45.000 COP\n🎨 Balayage / Tintura: $120.000 COP\n💅 Manicure & Pedicure Spa: $35.000 COP\n¿Cuál deseas agendar?`);
    } else if (action === "odoo") {
      sendAgentMessage(`¡Perfecto! Te reservamos cita en nuestro calendario Odoo. ¿Con qué barbero o estilista prefieres agendar y en qué horario? ✂️`);
    } else if (action === "barber") {
      sendAgentMessage(`Contamos con nuestros estilistas estrella: 💈 Barbero Alex (Cortes masculinos & barba) y 💇‍♀️ Estilista Sofía (Tintura & Balayage). ¿A quién prefieres?`);
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
          COLUMNA 1: LISTA DE CONVERSACIONES (RESPONSIVE)
      ══════════════════════════════════════ */}
      <div className={`${
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      } w-full md:w-[340px] flex-col shrink-0 border-r border-white/5 bg-[#0a0d15] pb-16 md:pb-0`}>
        
        {/* Dashboard Superior Salón */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#0d121f]/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-bold mb-2">
            <span className="text-slate-300 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <Scissors size={13} className="text-amber-400" /> Citas & Barbería
            </span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-extrabold border border-emerald-500/20">
              Citas Hoy: 18
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-white/5">
              <p className="text-slate-400">Total</p>
              <p className="font-extrabold text-white text-xs mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-cyan-500/20">
              <p className="text-cyan-400 font-bold">IA Citas</p>
              <p className="font-extrabold text-cyan-300 text-xs mt-0.5">{aiCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-slate-500/20">
              <p className="text-slate-400">Barbero</p>
              <p className="font-extrabold text-slate-200 text-xs mt-0.5">{humanCount}</p>
            </div>
            <div className="bg-[#07090e] p-1.5 rounded-lg border border-orange-500/20">
              <p className="text-orange-400 font-bold">Por Citar</p>
              <p className="font-extrabold text-orange-300 text-xs mt-0.5">{waitingCount}</p>
            </div>
          </div>
        </div>

        {/* Header & Search Bar */}
        <div className="p-3 border-b border-white/5 bg-[#07090e]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">Clientes del Salón</h2>
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
              placeholder="Buscar cliente, corte o teléfono..."
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
              <span>Cargando lista de agendamientos...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs text-center p-4">
              <MessageSquare size={26} className="text-slate-400/30" />
              <p className="font-bold text-slate-300">No hay citas en curso</p>
            </div>
          ) : filtered.map(s => {
            const isActive = active?.id === s.id;
            const statusInfo = getStatusDot(s);
            const lastMsg = getLastMsg(s);
            const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));
            const isHotLead = hasBooking || (s.history || []).length > 4;

            return (
              <button
                key={s.id}
                onClick={() => { setActive(s); setMobileView('chat'); }}
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

                {/* Subtitle: Service & Attention Status */}
                <p className="text-[10.5px] text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                  <span className="text-amber-400 font-semibold">✂️ Corte & Barba VIP</span>
                  <span>•</span>
                  <span>{statusInfo.label}</span>
                </p>

                {/* Snippet */}
                <p className="text-[11px] text-slate-400 truncate leading-snug mb-2 font-normal">
                  &quot;{lastMsg}&quot;
                </p>

                {/* Badges de Estado (Reagendamiento, Servicio, IA Score) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {isHotLead && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      <Flame size={9} /> Reagendamiento
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/15 text-amber-300 border border-amber-400/20">
                    💰 $45.000
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
          COLUMNA 2: WORKSPACE DE CHAT & IA (RESPONSIVE)
      ══════════════════════════════════════ */}
      {active ? (
        <div className={`${
          mobileView === 'chat' || mobileView === 'crm' ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col bg-[#07090e] min-w-0 pb-16 md:pb-0`}>
          
          {/* Header de Conversación del Salón con Botón Volver Móvil */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#0b0f19]/90 backdrop-blur-md flex flex-col gap-2 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-xl bg-white/5 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-xs text-slate-950 shadow-md shrink-0">
                  {(active.name || active.wa_from).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-sm text-white truncate">{active.name || active.wa_from}</h2>
                    <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      ✂️ Barbería
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-mono mt-0.5 truncate">
                    <span>Cliente Fiel</span>
                    <span>•</span>
                    <span className="text-amber-300 font-bold">$45.000 COP</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mobile CRM Toggle Button */}
                <button
                  onClick={() => setMobileView(mobileView === 'crm' ? 'chat' : 'crm')}
                  className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold flex items-center gap-1"
                  title="Ficha del cliente"
                >
                  <Info size={15} />
                </button>

                {/* Toggle IA Button */}
                <button
                  onClick={() => toggleBotMode(active)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    active.bot_mode
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                  }`}
                >
                  {active.bot_mode ? <Bot size={14} /> : <UserCheck size={14} />}
                  <span className="hidden sm:inline">{active.bot_mode ? "IA Agendando" : "Modo Barbero"}</span>
                </button>
              </div>
            </div>

            {/* Barra de Progreso del Agendamiento */}
            <div className="flex items-center gap-3 bg-[#07090e] px-3 py-1.5 rounded-lg border border-white/5 text-[10.5px]">
              <span className="font-bold text-slate-300 shrink-0 truncate">Paso 4 de 6: Barbero Alex</span>
              <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full" style={{ width: "66%" }} />
              </div>
              <span className="text-amber-300 font-bold shrink-0">66%</span>
            </div>

            {/* Acciones Rápidas del Salón */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
              <button
                onClick={() => handleQuickAction("phone")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold border border-white/5 transition-all shrink-0"
              >
                <Phone size={12} className="text-cyan-400" /> Llamar
              </button>
              <button
                onClick={() => handleQuickAction("services")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/20 transition-all shrink-0"
              >
                <Scissors size={12} /> Servicios
              </button>
              <button
                onClick={() => handleQuickAction("barber")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/20 transition-all shrink-0"
              >
                💈 Barbero
              </button>
              <button
                onClick={() => handleQuickAction("odoo")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 transition-all shrink-0"
              >
                <CalendarCheck size={12} /> Cita Odoo
              </button>
            </div>
          </div>

          {/* Banner de Resumen IA del Servicio de Belleza */}
          <div className="mx-4 mt-3 bg-[#0d121f] border border-cyan-500/20 rounded-2xl p-3.5 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs">
                <Sparkles size={14} />
                <span>RESUMEN IA DE LA CITA</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-medium">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Servicio: Corte Clásico + Barba VIP
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Barbero Preferido: Alex (Silla 2)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Horario Solicitado: Hoy a las 4:30 PM
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> Valor Estimado: $45.000 COP
                  </p>
                </div>

                <div className="bg-[#07090e] p-2.5 rounded-xl border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                  <div className="text-[11px]">
                    <span className="text-slate-400">Siguiente Acción Sugerida: </span>
                    <strong className="text-cyan-300">➡ Confirmar cita de 4:30 PM en Odoo Calendar</strong>
                  </div>
                  <button
                    onClick={() => sendAgentMessage("¡Listo! Tu cita de Corte + Barba ha quedado agendada para HOY a las 4:30 PM con el Barbero Alex. Te esperamos en la Barbería! ✂️💈")}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] shrink-0"
                  >
                    Confirmar en 1-Clic
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Mensajes Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
            {(active.history || []).map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                    isUser
                      ? "bg-[#0e1726] border border-white/10 text-slate-200 rounded-tl-none"
                      : msg.role === "agent"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-tr-none"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                  }`}>
                    {!isUser && (
                      <div className="flex items-center gap-1 mb-1 text-[9px] font-black uppercase tracking-wider opacity-85">
                        {msg.role === "agent" ? "Barbero / Recepción" : "BeautySync IA"}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Formulario de Respuesta */}
          <div className="p-3 border-t border-white/5 bg-[#0b0f19]/80 backdrop-blur-md">
            {!active.bot_mode ? (
              <div className="flex items-center gap-2 bg-[#07090e] border border-white/10 focus-within:border-cyan-500/40 rounded-xl px-3 py-2">
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
              <div className="bg-[#07090e] border border-white/5 rounded-xl py-2 px-3 text-center text-slate-400 text-xs font-semibold">
                🤖 La IA está agendando citas automáticamente. Desactiva modo IA para escribir.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ══════════════════════════════════════
          COLUMNA 3: PANEL DERECHO CRM BARBERÍA & SALÓN (RESPONSIVE MODAL ON MOBILE)
      ══════════════════════════════════════ */}
      {active && (
        <div className={`${
          mobileView === 'crm' ? 'flex fixed inset-0 z-50 bg-[#0a0d15] p-4' : 'hidden lg:flex'
        } w-full lg:w-[320px] flex-col shrink-0 border-l border-white/5 bg-[#0a0d15] overflow-y-auto`}>
          
          {/* Header del Panel CRM */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0d121f] rounded-t-xl">
            <div className="flex items-center gap-2">
              {mobileView === 'crm' && (
                <button
                  onClick={() => setMobileView('chat')}
                  className="lg:hidden p-1 text-slate-400 hover:text-white"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Scissors size={14} className="text-amber-400" /> Ficha del Cliente
              </span>
            </div>
            
            <div className="flex bg-[#07090e] p-0.5 rounded-lg border border-white/5 text-[10px] font-bold">
              <button
                onClick={() => setActiveRightTab("crm")}
                className={`px-2.5 py-1 rounded transition-all ${
                  activeRightTab === "crm" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Perfil
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
                  <h3 className="font-extrabold text-sm text-white">{active.name || "Cliente Salón"}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">+{active.wa_from}</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold flex items-center gap-1">
                    <MapPin size={9} /> Bogotá, CO
                  </span>
                </div>
              </div>

              {/* Probabilidad de Cita & Reagendamiento */}
              <div className="bg-[#0d121f] p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Score de Asistencia</span>
                  <span className="font-extrabold text-cyan-400 font-mono text-sm">94%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full" style={{ width: "94%" }} />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="font-bold text-slate-300">Estado Reagendamiento</span>
                  <span className="font-black text-rose-400 flex items-center gap-1 text-xs">
                    <Flame size={14} className="fill-rose-400" /> 🔥 Listo para Cita
                  </span>
                </div>
              </div>

              {/* Historial de Belleza del Cliente */}
              <div className="bg-[#0d121f] p-4 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Servicio Favorito:</span>
                  <strong className="text-amber-300">Corte + Barba VIP</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estilista Habitual:</span>
                  <strong className="text-cyan-300">Barbero Alex</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frecuencia Visita:</span>
                  <span className="text-slate-300 font-mono">Cada 15 días</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Última Visita:</span>
                  <span className="text-emerald-400 font-mono">Hace 14 días</span>
                </div>
              </div>

              {/* Recomendación IA de Reagendamiento */}
              <div className="bg-gradient-to-br from-amber-500/10 to-cyan-500/10 border border-amber-400/20 p-4 rounded-2xl space-y-2">
                <p className="font-extrabold text-amber-300 flex items-center gap-1 text-[11px]">
                  <Sparkles size={12} /> RECOMENDACIÓN REAGENDAMIENTO
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Cliente frecuente cumplió 14 días desde su último corte. Sugerir combo Corte + Perfilado de Cejas.
                </p>
                <button
                  onClick={() => { handleQuickAction("services"); if (mobileView === 'crm') setMobileView('chat'); }}
                  className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-md mt-1"
                >
                  Enviar Oferta Reagendamiento
                </button>
              </div>

            </div>
          ) : (
            /* Tab: Timeline de Citas del Cliente */
            <div className="p-4 space-y-4 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Historial de Reservas</h4>
              
              <div className="relative border-l border-white/10 pl-4 space-y-4 ml-2">
                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:10 AM</p>
                  <p className="font-bold text-white">Entró por WhatsApp Meta</p>
                  <p className="text-[10.5px] text-slate-400">Campañas Anuncio Corte & Barba</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:11 AM</p>
                  <p className="font-bold text-white">IA Consultó Disponibilidad</p>
                  <p className="text-[10.5px] text-slate-400">Solicitó horario 4:30 PM con Barbero Alex</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:12 AM</p>
                  <p className="font-bold text-white">Confirmación en Odoo</p>
                  <p className="text-[10.5px] text-slate-400">Cita precargada en Odoo Calendar</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[21px] top-0 w-2.5 h-2.5 rounded-full bg-rose-400 border-2 border-[#0a0d15]" />
                  <p className="text-[10px] font-mono text-slate-400">09:14 AM</p>
                  <p className="font-bold text-white">Recordatorio Automático</p>
                  <p className="text-[10.5px] text-slate-400">Notificación de 1 hora previa activada</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



