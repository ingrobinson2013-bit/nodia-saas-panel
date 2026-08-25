'use client';

import React from 'react';
import { ChatSession } from '@/lib/types';
import { Bot, User, CheckCircle, SidebarOpen, SidebarClose, ArrowLeft } from 'lucide-react';
import { getClientName, getInitials } from '@/lib/inbox-utils';

interface ChatHeaderProps {
  session: ChatSession;
  onToggleBot: (session: ChatSession) => void;
  showCrmPanel: boolean;
  onToggleCrmPanel: () => void;
  onBackToList?: () => void;
}

export default function ChatHeader({
  session,
  onToggleBot,
  showCrmPanel,
  onToggleCrmPanel,
  onBackToList,
}: ChatHeaderProps) {
  const clientName = getClientName(session);
  const initials = getInitials(clientName, session.wa_from);
  const isBotActive = session.bot_mode;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between z-10 flex-shrink-0">
      {/* Left Customer Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Back Button */}
        {onBackToList && (
          <button
            onClick={onBackToList}
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Volver a la lista de chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs md:text-sm font-bold text-slate-800 truncate">
              {clientName || `+${session.wa_from}`}
            </h2>
            {session.cita_odoo_id ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] md:text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> #{session.cita_odoo_id}
              </span>
            ) : null}
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
            <span className="font-medium text-slate-600">+{session.wa_from}</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium truncate">WhatsApp API</span>
          </p>
        </div>
      </div>

      {/* Right Controls & Bot / Human Switch */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        <div className="flex items-center bg-slate-100 p-0.5 md:p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => !isBotActive && onToggleBot(session)}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              isBotActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Activar IA para responder automáticamente"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">IA Bot</span>
          </button>

          <button
            onClick={() => isBotActive && onToggleBot(session)}
            className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              !isBotActive
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Pausar IA y tomar control manual"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Humano</span>
          </button>
        </div>

        {/* Toggle CRM Side Panel */}
        <button
          onClick={onToggleCrmPanel}
          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
            showCrmPanel
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title={showCrmPanel ? 'Ocultar panel CRM' : 'Ver panel CRM de Odoo'}
        >
          {showCrmPanel ? (
            <>
              <SidebarClose className="w-4 h-4" />
              <span className="hidden lg:inline">CRM Odoo</span>
            </>
          ) : (
            <>
              <SidebarOpen className="w-4 h-4" />
              <span className="hidden lg:inline">CRM Odoo</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
