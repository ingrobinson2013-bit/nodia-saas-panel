'use client';

import React, { useState, FormEvent, KeyboardEvent, useRef } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Mic,
  Sparkles,
  BookOpen,
  Bot,
  UserCheck,
  Zap,
  Flame,
  Clock,
  Calendar,
} from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  sending: boolean;
  isHumanMode: boolean;
  onActivateHumanMode: () => void;
  clientName?: string | null;
}

export const QUICK_COMMANDS = [
  {
    cmd: '/contacto',
    title: '🔥 Contacto Inicial Meta (Ecosistema)',
    category: 'meta',
    text: 'Hola {{nombre}}, veo que tienes interés en el Ecosistema Inteligente, a continuación te proporcionamos los enlaces con la información del sistema, así: Así se verá tu negocio en la Web: https://beautysyncpro.appteso.cloud/shop Aquí puedes probar el Agendamiento: https://beautysyncpro.appteso.cloud/agendar Aquí puedes Validar como se Paga el Sistema:https://tienda.tesoconsulting.co/beautysync-pro 🤩 Déjanos saber en que momento tienes disponibilidad para atender una llamada 📱 Asesor personalizado: 3053668614 (Escribe o llama) ¡Pronto te Contactaremos! 📲',
  },
  {
    cmd: '/reactivar',
    title: '⚡ Reactivación / Remarketing (10% Descuento)',
    category: 'meta',
    text: 'Hola {{nombre}}, Entiendo que puedes estar ocupado 🙌 Te dejo nuevamente la información para que la revises con calma. Tenemos disponibilidad y un beneficio del 10% si confirmas en las próximas 24 horas. https://www.tiktok.com/@tesoconsulting1/video/7661861677360499975?is_from_webapp=1&sender_device=pc',
  },
  {
    cmd: '/cita',
    title: '📅 Recordatorio Cita Odoo',
    category: 'odoo',
    text: '¡Hola {{nombre}}! Te recordamos tu cita agendada en Odoo. Por favor confírmanos tu asistencia respondiendo a este mensaje. ¡Te esperamos!',
  },
  {
    cmd: '/saludo',
    title: '👋 Saludo de Bienvenida',
    category: 'general',
    text: '¡Hola {{nombre}}! Qué gusto saludarte. Bienvenido/a a nuestro centro. ¿En qué servicio estás interesado el día de hoy?',
  },
  {
    cmd: '/precios',
    title: '💈 Lista de Precios y Servicios',
    category: 'general',
    text: 'Nuestros servicios destacados son:\n💈 Corte Clásico: $25.000\n✂️ Perfilado de Barba Spa: $18.000\n✨ Limpieza Facial Profunda: $45.000\n🧖 Combo Completo Relax: $75.000\n\n¿Te gustaría apartar tu turno?',
  },
  {
    cmd: '/banco',
    title: '💳 Datos de Pago / Transferencia',
    category: 'general',
    text: 'Para asegurar tu turno puedes realizar el anticipo a nuestra cuenta:\n• Nequi / Daviplata: 312 789 9824\n• Bancolombia Ahorros: 123-456789-01\nPor favor envíanos el comprobante por este medio.',
  },
];

export default function MessageComposer({
  onSendMessage,
  sending,
  isHumanMode,
  onActivateHumanMode,
  clientName,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [slashSearch, setSlashSearch] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formattedName = clientName && clientName.trim() ? clientName.trim().split(' ')[0] : 'estimado cliente';

  const prepareText = (rawText: string) => {
    return rawText.replace(/\{\{nombre\}\}/g, formattedName).replace(/\{nombre\}/g, formattedName);
  };

  const filteredCommands =
    slashSearch !== null
      ? QUICK_COMMANDS.filter(
          (c) =>
            c.cmd.toLowerCase().includes(slashSearch.toLowerCase()) ||
            c.title.toLowerCase().includes(slashSearch.toLowerCase())
        )
      : [];

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    const lastSlashIndex = val.lastIndexOf('/');
    if (
      lastSlashIndex !== -1 &&
      (lastSlashIndex === 0 ||
        val[lastSlashIndex - 1] === ' ' ||
        val[lastSlashIndex - 1] === '\n')
    ) {
      const query = val.slice(lastSlashIndex);
      setSlashSearch(query);
      setSelectedIndex(0);
    } else {
      setSlashSearch(null);
    }
  };

  const insertCommand = (cmdText: string) => {
    const processed = prepareText(cmdText);
    setMessage(processed);
    setSlashSearch(null);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleSendDirect = (cmdText: string) => {
    if (!isHumanMode) {
      onActivateHumanMode();
    }
    const processed = prepareText(cmdText);
    onSendMessage(processed);
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || sending) return;
    onSendMessage(message.trim());
    setMessage('');
    setShowTemplates(false);
    setSlashSearch(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashSearch !== null && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          insertCommand(selected.text);
          return;
        }
      }
      if (e.key === 'Escape') {
        setSlashSearch(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-3 select-none flex-shrink-0 relative">
      {/* Quick Meta Template Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Zap className="w-3 h-3 text-amber-500" /> Plantillas Meta:
        </span>
        <button
          type="button"
          onClick={() => insertCommand(QUICK_COMMANDS[0].text)}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          title="Cargar plantilla de Contacto Inicial Meta en el editor"
        >
          <Flame className="w-3 h-3 text-emerald-600" />
          <span>Contacto Inicial</span>
        </button>
        <button
          type="button"
          onClick={() => insertCommand(QUICK_COMMANDS[1].text)}
          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-lg border border-blue-200 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          title="Cargar plantilla de Reactivación / Remarketing con 10% Descuento"
        >
          <Clock className="w-3 h-3 text-blue-600" />
          <span>Reactivación 24h</span>
        </button>
        <button
          type="button"
          onClick={() => insertCommand(QUICK_COMMANDS[2].text)}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-semibold rounded-lg border border-purple-200 flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          title="Cargar recordatorio de Cita Odoo"
        >
          <Calendar className="w-3 h-3 text-purple-600" />
          <span>Recordatorio Odoo</span>
        </button>
      </div>

      {/* Slash Command Autocomplete Popover */}
      {slashSearch !== null && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Atajos Rápidos (Escribe para filtrar)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Enter o Clic para insertar</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.cmd}
                type="button"
                onClick={() => insertCommand(cmd.text)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-100/70 px-1.5 py-0.5 rounded">
                  {cmd.cmd}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{cmd.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {prepareText(cmd.text)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Templates Drawer */}
      {showTemplates && (
        <div className="mb-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Plantillas Oficiales Meta WhatsApp & Odoo
            </span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK_COMMANDS.map((tmpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertCommand(tmpl.text)}
                className="text-left p-2.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-900 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-bold text-slate-800 text-[11px]">{tmpl.title}</p>
                  <span className="font-mono text-[9px] text-blue-600 bg-blue-50 px-1 rounded">
                    {tmpl.cmd}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {prepareText(tmpl.text)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Active Banner */}
      {!isHumanMode && (
        <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600 animate-pulse flex-shrink-0" />
            <span>
              La IA está atendiendo este chat automáticamente. Escribe{' '}
              <span className="font-bold text-blue-700">/</span> para ver atajos.
            </span>
          </div>
          <button
            type="button"
            onClick={onActivateHumanMode}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" /> Tomar Control
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={!isHumanMode}
            placeholder={
              isHumanMode
                ? 'Escribe un mensaje... (Usa / para atajos rápidos o Enter para enviar)'
                : 'Activa Modo Humano para escribir manualmente...'
            }
            rows={2}
            className={`w-full p-2.5 rounded-xl border text-xs md:text-sm focus:outline-none resize-none transition-all placeholder:text-slate-400 ${
              isHumanMode
                ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Toolbar & Send Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showTemplates
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title="Ver plantillas rápidas"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Plantillas (/)</span>
            </button>

            <button
              type="button"
              disabled={!isHumanMode}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Adjuntar archivo o imagen"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={!isHumanMode}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Insertar emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || sending || !isHumanMode}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{sending ? 'Enviando...' : 'Enviar'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
