'use client';

import React, { useState, useMemo } from 'react';
import { ChatSession } from '@/lib/types';
import { Search, Filter, MessageSquare, Clock, Check } from 'lucide-react';
import {
  getClientName,
  getIntent,
  getWaitTime,
  getTimeGroup,
  isWaitingForResponse,
  getInitials,
} from '@/lib/inbox-utils';

type FilterType = 'todos' | 'pendientes' | 'agendados' | 'takeover';

interface ConversationListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
}

export default function ConversationList({
  sessions,
  activeSessionId,
  onSelectSession,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => {
        const name = getClientName(s.history)?.toLowerCase() || '';
        return (
          name.includes(q) ||
          s.wa_from.includes(q) ||
          s.history?.some((m) => m.content.toLowerCase().includes(q))
        );
      });
    }

    // Filter type
    if (activeFilter === 'pendientes') {
      list = list.filter((s) => isWaitingForResponse(s.history));
    } else if (activeFilter === 'agendados') {
      list = list.filter((s) => s.estado === 'cita_agendada' || s.cita_odoo_id !== null);
    } else if (activeFilter === 'takeover') {
      list = list.filter((s) => !s.bot_mode);
    }

    // Intelligent Sort: Pending user messages first -> Takeovers -> Recent timestamp
    list.sort((a, b) => {
      const aPending = isWaitingForResponse(a.history) ? 0 : 1;
      const bPending = isWaitingForResponse(b.history) ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;

      const aTakeover = !a.bot_mode ? 0 : 1;
      const bTakeover = !b.bot_mode ? 0 : 1;
      if (aTakeover !== bTakeover) return aTakeover - bTakeover;

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [sessions, search, activeFilter]);

  // Group by Time
  const groupedSessions = useMemo(() => {
    const order = ['Hoy', 'Ayer', 'Esta semana', 'Más antiguos'];
    const map: Record<string, ChatSession[]> = {};
    filteredSessions.forEach((s) => {
      const g = getTimeGroup(s.updated_at);
      if (!map[g]) map[g] = [];
      map[g].push(s);
    });
    return order.filter((g) => map[g]?.length > 0).map((g) => ({ label: g, items: map[g] }));
  }, [filteredSessions]);

  const pendingCount = sessions.filter((s) => isWaitingForResponse(s.history)).length;
  const takeoverCount = sessions.filter((s) => !s.bot_mode).length;

  return (
    <div className="w-80 md:w-88 xl:w-96 bg-white border-r border-slate-200 flex flex-col h-full select-none flex-shrink-0">
      {/* Top Search & Filter Bar */}
      <div className="p-3 border-b border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, teléfono..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            title="Filtrar conversaciones"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills (Pancake Style) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Todos ({sessions.length})
          </button>

          <button
            onClick={() => setActiveFilter('pendientes')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeFilter === 'pendientes'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span>🔴 Pendientes</span>
            {pendingCount > 0 && (
              <span className="bg-white text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFilter('agendados')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeFilter === 'agendados'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <span>📅 Citas Odoo</span>
          </button>

          <button
            onClick={() => setActiveFilter('takeover')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeFilter === 'takeover'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>⚡ Asesor ({takeoverCount})</span>
          </button>
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No hay conversaciones</p>
            <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando los filtros de búsqueda</p>
          </div>
        ) : (
          groupedSessions.map((group) => (
            <div key={group.label}>
              {/* Group Header */}
              <div className="px-3.5 py-1.5 bg-slate-50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                {group.label}
              </div>

              {group.items.map((session) => {
                const name = getClientName(session.history);
                const initials = getInitials(name, session.wa_from);
                const messages = session.history?.filter((m) => m.role !== 'system') || [];
                const lastMsg = messages[messages.length - 1];
                const intent = lastMsg ? getIntent(lastMsg.content) : null;
                const isWaiting = isWaitingForResponse(session.history);
                const isSelected = session.id === activeSessionId;
                const waitTime = getWaitTime(session.updated_at);
                const isBotActive = session.bot_mode;

                const avatarBg = isWaiting
                  ? 'bg-rose-100 text-rose-700 border-rose-300'
                  : !isBotActive
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={`relative p-3.5 border-b border-slate-100 cursor-pointer transition-all duration-150 flex gap-3 items-start ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600 shadow-xs'
                        : 'border-l-4 border-l-transparent hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border ${avatarBg} shadow-xs`}
                      >
                        {initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white text-white text-[8px] font-bold">
                        WA
                      </div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {name || `+${session.wa_from}`}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 flex-shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {waitTime}
                        </span>
                      </div>

                      {/* Last Message Snippet */}
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5 leading-tight">
                        {!isBotActive && (
                          <span className="font-semibold text-amber-700 mr-1">[Asesor]:</span>
                        )}
                        {isBotActive && lastMsg?.role === 'assistant' && (
                          <span className="font-semibold text-blue-600 mr-1">[IA]:</span>
                        )}
                        {lastMsg ? lastMsg.content : 'Sin mensajes'}
                      </p>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {isWaiting && (
                          <span className="text-[9px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                            🔴 Espera Respuesta
                          </span>
                        )}

                        {session.cita_odoo_id ? (
                          <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Cita #{session.cita_odoo_id}
                          </span>
                        ) : null}

                        {isBotActive ? (
                          <span className="text-[9px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            🤖 IA Activa
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                            ⚡ Humano
                          </span>
                        )}

                        {intent && (
                          <span className="text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {intent.icon} {intent.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
