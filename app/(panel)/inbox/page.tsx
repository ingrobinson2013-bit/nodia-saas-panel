"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChatSession, Message } from "@/lib/types";
import {
  MessageCircle, Bot, User, Send, Search,
  ToggleLeft, ToggleRight, RefreshCw, Zap, Clock
} from "lucide-react";
import { getTenantId } from "@/lib/tenant";

const TENANT_ID = getTenantId();

export default function InboxPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [active, setActive] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");
  const [agentMsg, setAgentMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Cargar sesiones
  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("tenant_id", TENANT_ID)
      .eq("estado", "activo")
      .order("updated_at", { ascending: false });
    setSessions((data as ChatSession[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("chat_sessions_changes")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chat_sessions",
        filter: `tenant_id=eq.${TENANT_ID}`,
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
  }, [active]);

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
    if (!agentMsg.trim() || !active) return;
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
            tenant_id: TENANT_ID,
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

  return (
    <div className="flex h-screen bg-[#0f1117] text-white font-sans">
      {/* SIDEBAR — Lista de conversaciones */}
      <div className="w-[340px] border-r border-white/5 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <MessageCircle size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">Bandeja de Entrada</span>
            </div>
            <button onClick={fetchSessions} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
            <Search size={15} className="text-white/30" />
            <input
              className="bg-transparent text-sm text-white placeholder-white/30 outline-none flex-1"
              placeholder="Buscar conversación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
              <MessageCircle size={24} />
              <span>Sin conversaciones activas</span>
            </div>
          ) : filtered.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all ${active?.id === s.id ? "bg-white/8" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${s.bot_mode ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"}`}>
                  {(s.name || s.wa_from).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white truncate">{s.name || s.wa_from}</span>
                    <span className="text-[11px] text-white/30 shrink-0 ml-2">{formatTime(s.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {s.bot_mode ? (
                      <Bot size={11} className="text-emerald-400 shrink-0" />
                    ) : (
                      <User size={11} className="text-violet-400 shrink-0" />
                    )}
                    <p className="text-xs text-white/40 truncate">{getLastMsg(s)}</p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      {active ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0f1117]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${active.bot_mode ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-400"}`}>
                {(active.name || active.wa_from).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{active.name || active.wa_from}</p>
                <p className="text-xs text-white/40">{active.wa_from}</p>
              </div>
            </div>

            {/* Toggle Bot Mode */}
            <button
              onClick={() => toggleBotMode(active)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                active.bot_mode
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
              }`}
            >
              {active.bot_mode ? (
                <><Bot size={16} /><span>IA Activa</span><ToggleRight size={20} /></>
              ) : (
                <><User size={16} /><span>Modo Humano</span><ToggleLeft size={20} /></>
              )}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(active.history || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 gap-3">
                <MessageCircle size={40} />
                <p className="text-sm">Sin mensajes aún</p>
              </div>
            ) : (
              (active.history || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-white/8 text-white/90 rounded-tl-sm"
                      : msg.role === "agent"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-emerald-600/80 text-white rounded-tr-sm"
                  }`}>
                    {msg.role !== "user" && (
                      <div className="flex items-center gap-1 mb-1 opacity-70">
                        {msg.role === "agent" ? <User size={11} /> : <Zap size={11} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {msg.role === "agent" ? "Tú" : "IA"}
                        </span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input — solo visible en modo humano */}
          {!active.bot_mode && (
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
                <input
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  placeholder="Escribe un mensaje como agente..."
                  value={agentMsg}
                  onChange={e => setAgentMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendAgentMessage()}
                />
                <button
                  onClick={sendAgentMessage}
                  disabled={!agentMsg.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-xs text-white/20 mt-2 flex items-center justify-center gap-1">
                <User size={11} /> Modo humano activo — la IA está pausada
              </p>
            </div>
          )}
          {active.bot_mode && (
            <div className="p-4 border-t border-white/5 flex items-center justify-center gap-2 text-white/20 text-xs">
              <Bot size={14} className="text-emerald-400" />
              <span>La IA está respondiendo automáticamente</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
          <MessageCircle size={48} />
          <p className="text-lg font-semibold">Selecciona una conversación</p>
          <p className="text-sm">Las conversaciones aparecen en tiempo real</p>
        </div>
      )}
    </div>
  );
}
