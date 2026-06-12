"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatSession, Message } from "@/lib/types";
import {
  MessageCircle, Bot, User, Send, Search,
  ToggleLeft, ToggleRight, RefreshCw, Zap, Clock,
  Sparkles, Phone, Shield, UserCheck
} from "lucide-react";
import { getTenantId } from "@/lib/tenant";

export default function InboxPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [active, setActive] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");
  const [agentMsg, setAgentMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar sesiones
  const fetchSessions = async (tid?: string) => {
    const activeTid = tid || tenantId;
    if (!activeTid) return;
    setLoading(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("tenant_id", activeTid)
      .eq("estado", "activo")
      .order("updated_at", { ascending: false });
    setSessions((data as ChatSession[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    const tid = getTenantId();
    setTenantId(tid);
    fetchSessions(tid);
  }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel("chat_sessions_changes")
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
        if (active?.id === updated.id) setActive(updated);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active, tenantId]);

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active]);

  const toggleBotMode = async (session: ChatSession) => {
    const newMode = !session.bot_mode;
    await supabase.from("chat_sessions")
      .update({ bot_mode: newMode })
      .eq("id", session.id);
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, bot_mode: newMode } : s));
    if (active?.id === session.id) setActive({ ...session, bot_mode: newMode });
  };

  const sendAgentMessage = async () => {
    if (!agentMsg.trim() || !active || !tenantId) return;
    const text = agentMsg;
    setAgentMsg("");

    // Llamar al backend FastAPI → envía por WhatsApp real
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
      alert("Error al enviar el mensaje. Verifica la conexión con el backend.");
    }
  };

  const filtered = sessions.filter(s =>
    (s.name || s.wa_from).toLowerCase().includes(search.toLowerCase())
  );

  const getLastMsg = (s: ChatSession) => {
    const h = s.history || [];
    return h.length > 0 ? h[h.length - 1].content : "Sin mensajes";
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  };

  const isPast24Hours = (s: ChatSession | null) => {
    if (!s || !s.history || s.history.length === 0) return true;
    const lastUserMsg = [...s.history].reverse().find(m => m.role === "user");
    if (!lastUserMsg || !lastUserMsg.timestamp) return true;
    const msgDate = new Date(lastUserMsg.timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - msgDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  const past24h = isPast24Hours(active);

  return (
    <div className="flex h-screen bg-[#07090e] text-white font-sans antialiased">
      {/* SIDEBAR — Lista de conversaciones */}
      <div className="w-[360px] border-r border-white/5 flex flex-col bg-[#0b0e14] shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white block">Mensajería</span>
                <span className="text-[10px] text-white/40 font-medium block">BeautySync Pro Inbox</span>
              </div>
            </div>
            <button 
              onClick={() => fetchSessions()} 
              className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white/50 hover:text-white transition-all duration-300"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="flex items-center gap-2.5 bg-white/[0.03] focus-within:bg-white/[0.06] border border-white/5 focus-within:border-cyan-500/30 rounded-2xl px-4 py-3 transition-all duration-300">
            <Search size={15} className="text-white/30" />
            <input
              className="bg-transparent text-sm text-white placeholder-white/20 outline-none flex-1"
              placeholder="Buscar por cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20 gap-3">
              <RefreshCw size={24} className="animate-spin text-cyan-400" />
              <span className="text-xs">Sincronizando chats...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-white/20 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <MessageCircle size={20} className="text-white/30" />
              </div>
              <span className="text-xs font-medium">Sin chats de leads en curso</span>
            </div>
          ) : filtered.map(s => {
            const isActive = active?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3.5 border ${
                  isActive 
                    ? "bg-white/[0.06] border-white/10 shadow-lg shadow-black/20" 
                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                }`}
              >
                {/* Avatar con anillo luminoso */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    s.bot_mode 
                      ? "bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/5" 
                      : "bg-violet-500/10 text-violet-400 ring-2 ring-violet-500/30 shadow-md shadow-violet-500/5"
                  }`}>
                    {(s.name || s.wa_from).charAt(0).toUpperCase()}
                  </div>
                  {/* Glowing Status Dot */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0b0e14] ${
                    s.bot_mode ? "bg-emerald-500 animate-pulse" : "bg-violet-500"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[13.5px] text-white/90 truncate tracking-tight">{s.name || s.wa_from}</span>
                    <span className="text-[10px] text-white/30 shrink-0 ml-2 font-medium">{formatTime(s.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {s.bot_mode ? (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                        <Bot size={8} /> IA
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-extrabold uppercase tracking-wider shrink-0">
                        <User size={8} /> Agente
                      </span>
                    )}
                    <p className="text-xs text-white/40 truncate leading-none">{getLastMsg(s)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT WINDOW */}
      {active ? (
        <div className="flex-1 flex flex-col bg-[#07090e]">
          {/* Chat Header */}
          <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between bg-[#0b0e14]/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base ${
                active.bot_mode 
                  ? "bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/20" 
                  : "bg-violet-500/10 text-violet-400 ring-2 ring-violet-500/20"
              }`}>
                {(active.name || active.wa_from).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[15px] text-white tracking-tight leading-snug">{active.name || active.wa_from}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone size={10} className="text-white/30" />
                  <span className="text-[11px] text-white/40 font-mono font-medium">{active.wa_from}</span>
                </div>
              </div>
            </div>

            {/* Toggle Switch Premium */}
            <button
              onClick={() => toggleBotMode(active)}
              className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl text-[12.5px] font-bold border transition-all duration-300 ${
                active.bot_mode
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/5 hover:bg-emerald-500/20"
                  : "bg-violet-500/10 border-violet-500/20 text-violet-400 shadow-md shadow-violet-500/5 hover:bg-violet-500/20"
              }`}
            >
              {active.bot_mode ? (
                <>
                  <Bot size={15} className="animate-bounce" />
                  <span>IA Respondiendo</span>
                  <ToggleRight size={20} className="text-emerald-400" />
                </>
              ) : (
                <>
                  <UserCheck size={15} />
                  <span>Modo Humano</span>
                  <ToggleLeft size={20} className="text-violet-400" />
                </>
              )}
            </button>
          </div>

          {/* Messages Container (Fondo con Gradiente Radial sutil) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4.5" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.01) 0%, transparent 80%)'
          }}>
            {(active.history || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center">
                  <MessageCircle size={22} className="text-white/20" />
                </div>
                <p className="text-sm font-medium">Sin historial de chat</p>
              </div>
            ) : (
              (active.history || []).map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"} animate-fade-in`}>
                    <div className={`max-w-[70%] rounded-2xl px-4.5 py-3.5 shadow-md transition-all duration-300 ${
                      isUser
                        ? "bg-[#141822] border border-white/5 text-white/90 rounded-tl-none"
                        : msg.role === "agent"
                        ? "bg-gradient-to-tr from-violet-600 to-indigo-500 text-white rounded-tr-none shadow-indigo-600/10"
                        : "bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white rounded-tr-none shadow-emerald-600/10"
                    }`}>
                      {!isUser && (
                        <div className="flex items-center gap-1 mb-1.5 opacity-85">
                          {msg.role === "agent" ? (
                            <User size={10} className="text-white" />
                          ) : (
                            <Sparkles size={10} className="text-cyan-200" />
                          )}
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/90">
                            {msg.role === "agent" ? "Agente (Tú)" : "Autómata IA"}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-white/5 bg-[#0b0e14]/30 backdrop-blur-md">
            {!active.bot_mode ? (
              past24h ? (
                <div className="bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl p-5 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                    <Clock className="text-amber-400" size={20} />
                  </div>
                  <p className="text-sm font-bold text-amber-400 tracking-tight">Cierre de Ventana de 24 Horas</p>
                  <p className="text-xs text-white/40 mt-1 max-w-md leading-relaxed">
                    Meta bloquea el envío de textos libres después de 24 horas del último mensaje del usuario para evitar SPAM.
                  </p>
                  <button className="mt-3.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs px-5 py-2.5 rounded-xl font-bold border border-amber-500/20 transition-all duration-300">
                    Enviar Plantilla Homologada
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 bg-white/[0.02] focus-within:bg-white/[0.04] border border-white/5 focus-within:border-violet-500/40 rounded-2xl px-4 py-3.5 transition-all duration-300">
                    <input
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                      placeholder="Responde como agente de soporte..."
                      value={agentMsg}
                      onChange={e => setAgentMsg(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendAgentMessage()}
                    />
                    <button
                      onClick={sendAgentMessage}
                      disabled={!agentMsg.trim()}
                      className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 disabled:opacity-20 disabled:pointer-events-none text-white shadow-lg shadow-violet-600/15 transition-all duration-300"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                  <p className="text-center text-[10.5px] text-white/30 mt-2.5 flex items-center justify-center gap-1.5 font-medium">
                    <Shield size={11} className="text-violet-400" /> Modo Humano activo. Las respuestas del Agente IA están pausadas temporalmente.
                  </p>
                </>
              )
            ) : (
              <div className="bg-[#0b0e14] border border-white/5 rounded-2xl py-4 flex items-center justify-center gap-2.5 text-white/30 text-xs font-semibold shadow-inner">
                <div className="relative">
                  <Bot size={16} className="text-emerald-400" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span>Agente IA está interactuando automáticamente con el cliente en tiempo real</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.015) 0%, transparent 60%)'
        }}>
          <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-lg shadow-black/10">
            <MessageCircle size={28} className="text-white/20" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-white/80 tracking-tight">Selecciona una conversación</p>
            <p className="text-xs text-white/30">Los chats activos de tus leads y clientes se cargarán automáticamente aquí</p>
          </div>
        </div>
      )}
    </div>
  );
}
