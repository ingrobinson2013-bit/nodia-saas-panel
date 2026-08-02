"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatSession } from "@/lib/types";
import {
  MessageSquare, Bot, User, Send, Search,
  ToggleLeft, ToggleRight, RefreshCw, Zap, Clock,
  Sparkles, Phone, Shield, UserCheck, CalendarCheck, CheckCheck
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
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from Supabase RLS
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

    // Auto-select first session if none active
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

  // Supabase Realtime channel subscription for live updates
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel("chat_sessions_realtime_inbox")
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

  // Smooth scroll to latest message
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

  const sendAgentMessage = async () => {
    if (!agentMsg.trim() || !active || !tenantId || sendingMsg) return;
    const text = agentMsg.trim();
    setAgentMsg("");
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
      alert("Error enviando el mensaje a través de Meta API.");
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

  const isPast24Hours = (s: ChatSession | null) => {
    if (!s || !s.history || s.history.length === 0) return false;
    const lastUserMsg = [...s.history].reverse().find(m => m.role === "user");
    if (!lastUserMsg || !lastUserMsg.timestamp) return false;
    const msgDate = new Date(lastUserMsg.timestamp);
    const diffHours = (new Date().getTime() - msgDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  const past24h = isPast24Hours(active);

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-amber-400 to-amber-600',
      'from-cyan-400 to-blue-600',
      'from-emerald-400 to-teal-600',
      'from-violet-400 to-purple-600',
      'from-pink-400 to-rose-600',
    ];
    const idx = (name.charCodeAt(0) || 0) % gradients.length;
    return gradients[idx];
  };

  return (
    <div className="flex h-[100dvh] bg-[#060913] text-white font-sans antialiased overflow-hidden select-none">

      {/* ══════════════════════════════════════
          SIDEBAR: LISTA DE CONVERSACIONES (360px)
      ══════════════════════════════════════ */}
      <div className={`${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      } w-full md:w-[360px] flex-col shrink-0 border-r border-white/5 bg-[#070a14]`}
      >
        {/* Header de Mensajería */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5 bg-gradient-to-b from-[#0e172a]/50 to-[#070a14] relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <MessageSquare size={20} />
              </div>
              <div>
                <h1 className="font-extrabold text-[15px] text-white tracking-tight leading-none">
                  Inbox Chat
                </h1>
                <p className="text-[11px] text-cyan-400 font-semibold mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {filtered.length} chat{filtered.length !== 1 ? 's' : ''} activo{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchSessions()}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-amber-400 transition-all duration-200"
              title="Refrescar chats"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 bg-[#0a0f1d] border border-white/10 focus-within:border-amber-500/40 transition-all duration-200">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              className="bg-transparent text-xs text-white placeholder-slate-400 outline-none flex-1 font-medium"
              placeholder="Buscar por cliente o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
              <RefreshCw size={20} className="animate-spin text-amber-400" />
              <span>Cargando conversaciones...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs text-center p-4">
              <MessageSquare size={28} className="text-slate-400/30" />
              <p className="font-bold text-slate-300">Sin mensajes entrantes</p>
              <p className="text-[11px] text-slate-400">Los clientes que escriban por WhatsApp aparecerán aquí inmediatamente.</p>
            </div>
          ) : filtered.map(s => {
            const isActive = active?.id === s.id;
            const initial = (s.name || s.wa_from || 'C').charAt(0).toUpperCase();
            const gradient = getAvatarGradient(s.name || s.wa_from || '');
            const lastMsg = getLastMsg(s);
            const hasBooking = s.cita_odoo_id || (s.history || []).some(m => m.content?.includes("agend") || m.content?.includes("cita"));

            return (
              <button
                key={s.id}
                onClick={() => { setActive(s); setMobileView('chat'); }}
                className={`w-full text-left rounded-2xl transition-all duration-200 flex items-center gap-3.5 px-3.5 py-3 group relative border ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 shadow-lg'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-black text-slate-950 shadow-md`}>
                    {initial}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#070a14] ${
                    s.bot_mode ? 'bg-cyan-400' : 'bg-amber-400'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-xs truncate leading-none ${isActive ? 'text-amber-300' : 'text-white group-hover:text-amber-200'}`}>
                      {s.name || s.wa_from}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2 font-mono">
                      {formatTime(s.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                      s.bot_mode
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                    }`}>
                      {s.bot_mode ? <><Bot size={8} /> IA</> : <><User size={8} /> Humano</>}
                    </span>
                    {hasBooking && (
                      <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20 shrink-0">
                        Cita
                      </span>
                    )}
                    <p className="text-[11.5px] text-slate-400 truncate leading-snug">{lastMsg}</p>
                  </div>
                </div>

                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-amber-400 shadow-md shadow-amber-400/50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CHAT MAIN PANEL (FLEX-1)
      ══════════════════════════════════════ */}
      {active ? (
        <div className={`${
          mobileView === "list" ? "hidden md:flex" : "flex"
        } flex-1 flex-col bg-[#060913]`}>
          
          {/* Chat Header */}
          <div className="px-6 py-3.5 border-b border-white/5 bg-[#0a0f1d]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                ←
              </button>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-slate-950 ${
                active.bot_mode
                  ? "bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20"
                  : "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20"
              }`}>
                {(active.name || active.wa_from).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm text-white tracking-tight leading-snug flex items-center gap-2">
                  <span>{active.name || active.wa_from}</span>
                  {active.cita_odoo_id && (
                    <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CalendarCheck size={10} /> Cita #{active.cita_odoo_id}
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                  <Phone size={10} className="text-slate-400" />
                  <span>+{active.wa_from}</span>
                </div>
              </div>
            </div>

            {/* Switch Mode Button */}
            <button
              onClick={() => toggleBotMode(active)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 shadow-lg ${
                active.bot_mode
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 shadow-cyan-500/5"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shadow-amber-500/5"
              }`}
            >
              {active.bot_mode ? (
                <>
                  <Bot size={15} className="animate-pulse" />
                  <span>IA Atendiendo</span>
                  <ToggleRight size={20} className="text-cyan-400" />
                </>
              ) : (
                <>
                  <UserCheck size={15} />
                  <span>Modo Humano</span>
                  <ToggleLeft size={20} className="text-amber-400" />
                </>
              )}
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.015) 0%, transparent 80%)'
          }}>
            {(active.history || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <MessageSquare size={32} className="text-slate-400/30" />
                <p className="text-xs font-semibold">Sin historial de chat guardado</p>
              </div>
            ) : (
              (active.history || []).map((msg, i) => {
                const isUser = msg.role === "user";
                let parsedAction: any = null;
                try {
                  const p = JSON.parse(msg.content);
                  if (p && p.action) parsedAction = p;
                } catch {}

                if (parsedAction) {
                  return (
                    <div key={i} className="flex justify-center my-3">
                      <div className="bg-[#0a0f1d] border border-amber-500/30 px-4 py-2 rounded-full text-xs text-amber-300 flex items-center gap-2 shadow-lg shadow-amber-500/5">
                        <Zap size={14} className="text-amber-400 flex-shrink-0" />
                        <span><strong>{parsedAction.action === 'BOOK' ? 'Cita Agendada en Odoo' : parsedAction.action}</strong></span>
                        {parsedAction.name && <span>para {parsedAction.name}</span>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-md ${
                      isUser
                        ? "bg-[#0e1726] border border-white/10 text-slate-200 rounded-tl-none"
                        : msg.role === "agent"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-tr-none shadow-amber-500/10"
                        : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-cyan-600/10"
                    }`}>
                      {!isUser && (
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black uppercase tracking-wider opacity-90">
                          {msg.role === "agent" ? (
                            <> <User size={10} /> Agente Humano </>
                          ) : (
                            <> <Sparkles size={10} /> BeautySync IA </>
                          )}
                        </div>
                      )}
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Formulario de Respuesta / Input Bar */}
          <div className="p-4 border-t border-white/5 bg-[#0a0f1d]/60 backdrop-blur-md">
            {!active.bot_mode ? (
              past24h ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                    <Clock size={16} /> Ventana de 24 Horas WhatsApp Meta Expire
                  </div>
                  <p className="text-[11px] text-slate-400">
                    El usuario no ha enviado mensajes en las últimas 24 horas. Usa una plantilla homologada de Meta para iniciar conversación.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#070a14] border border-white/10 focus-within:border-amber-500/40 rounded-2xl px-4 py-2.5 transition-all">
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                    placeholder="Escribe un mensaje como agente..."
                    value={agentMsg}
                    onChange={e => setAgentMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAgentMessage()}
                  />
                  <button
                    onClick={sendAgentMessage}
                    disabled={!agentMsg.trim() || sendingMsg}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
                  >
                    {sendingMsg ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              )
            ) : (
              <div className="bg-[#070a14] border border-white/5 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
                <Bot size={16} className="text-cyan-400 animate-pulse" />
                <span>La IA está atendiendo este chat automáticamente. Activa <strong className="text-amber-300 font-bold">Modo Humano</strong> para tomar el control.</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#0a0f1d] border border-white/5 flex items-center justify-center shadow-xl">
            <MessageSquare size={30} className="text-slate-400/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-white tracking-tight">Selecciona una conversación</p>
            <p className="text-xs text-slate-400">Los chats entrantes de tus clientes se cargarán en tiempo real aquí</p>
          </div>
        </div>
      )}
    </div>
  );
}

