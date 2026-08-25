'use client';

import React, { useState } from 'react';
import { ChatSession, InternalNote } from '@/lib/types';
import {
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Plus,
  ExternalLink,
  Scissors,
  X,
  AlertTriangle,
  Copy,
  Check,
  CalendarDays,
} from 'lucide-react';
import { getClientName, extractAppointmentFromHistory } from '@/lib/inbox-utils';

interface CustomerCrmPanelProps {
  session: ChatSession;
  onAddNote?: (noteText: string) => void;
  onUpdateSession?: () => void;
}

const SERVICES_LIST = [
  { id: '1', name: 'Corte Clásico & Estilo', price: 25000, duration: '30 min' },
  { id: '2', name: 'Perfilado de Barba Spa', price: 18000, duration: '25 min' },
  { id: '3', name: 'Limpieza Facial Profunda', price: 45000, duration: '45 min' },
  { id: '4', name: 'Combo Completo Spa Relax', price: 75000, duration: '60 min' },
];

const PROFESSIONALS_LIST = ['Jose Roa', 'Paola', 'Carolina', 'Valentina', 'Camilo'];

export default function CustomerCrmPanel({
  session,
  onAddNote,
  onUpdateSession,
}: CustomerCrmPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const [selectedService, setSelectedService] = useState(SERVICES_LIST[0].name);
  const [selectedProfessional, setSelectedProfessional] = useState(PROFESSIONALS_LIST[0]);
  const [appointmentDate, setAppointmentDate] = useState('2026-08-26');
  const [appointmentTime, setAppointmentTime] = useState('15:00');

  const [localNotes, setLocalNotes] = useState<InternalNote[]>([
    {
      id: '1',
      author: 'Robinson (Admin)',
      text: 'Cliente VIP habitual. Prefiere atención con Jose Roa.',
      created_at: new Date().toISOString(),
    },
  ]);

  const clientName = getClientName(session) || 'Cliente WhatsApp';
  const appointment = extractAppointmentFromHistory(session.history);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(`+${session.wa_from}`);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const noteObj: InternalNote = {
      id: Date.now().toString(),
      author: 'Asesor',
      text: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    setLocalNotes([noteObj, ...localNotes]);
    if (onAddNote) onAddNote(newNote.trim());
    setNewNote('');
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAction(true);
    try {
      await fetch('/api/odoo-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESCHEDULE_APPOINTMENT',
          tenantId: session.tenant_id,
          sessionId: session.id,
          payload: {
            service: selectedService,
            professional: selectedProfessional,
            date: appointmentDate,
            time: appointmentTime,
            price: SERVICES_LIST.find((s) => s.name === selectedService)?.price || 45000,
          },
        }),
      });
      setShowRescheduleModal(false);
      if (onUpdateSession) onUpdateSession();
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelAppointment = async () => {
    setProcessingAction(true);
    try {
      await fetch('/api/odoo-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_APPOINTMENT',
          tenantId: session.tenant_id,
          sessionId: session.id,
          appointmentId: session.cita_odoo_id,
          payload: { reason: 'Cancelado por solicitud del cliente vía CRM' },
        }),
      });
      setShowCancelModal(false);
      if (onUpdateSession) onUpdateSession();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <aside className="w-80 lg:w-88 bg-white border-l border-slate-200 flex flex-col h-full select-none flex-shrink-0">
      {/* Tab Switcher */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ficha & Citas Odoo
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'notes'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Notas</span>
            <span className="bg-slate-300 text-slate-700 text-[10px] px-1.5 rounded-full font-bold">
              {localNotes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'info' ? (
          <>
            {/* Customer Details Card */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{clientName}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>+{session.wa_from}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  title="Copiar número"
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedPhone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <a
                href={`https://wa.me/${session.wa_from}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Abrir en WhatsApp Web Oficial</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3" /> Ubicación:
                  </span>
                  <span className="font-semibold text-slate-700 text-[11px]">Bogotá D.C.</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Tag className="w-3 h-3" /> Estado:
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {session.estado || 'Activo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Odoo Live Appointment Card */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden">
              <div className="bg-blue-50/80 px-3.5 py-2.5 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-950">
                    Cita Odoo #{session.cita_odoo_id || '2841'}
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Confirmada
                </span>
              </div>

              <div className="p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 border-b border-slate-100 pb-2">
                  <span className="text-slate-400">1. Solicitada</span>
                  <span className="text-blue-600 font-bold">✓ 2. Confirmada</span>
                  <span className="text-slate-400">3. Atendida</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Scissors className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">
                        {appointment?.service || 'Corte Clásico & Perfilado Barba'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Profesional: <strong className="text-slate-700">{appointment?.professional || 'Jose Roa'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {appointment?.date || 'Mañana 26 Ago'} • {appointment?.time || '3:00 PM'}
                    </span>
                    <span className="font-bold text-emerald-700 text-xs">
                      ${(appointment?.price || 45000).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRescheduleModal(true)}
                    className="py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Reprogramar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors border border-rose-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe una nota interna confidencial..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
              />
              <button
                type="submit"
                disabled={!newNote.trim()}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar Nota Interna</span>
              </button>
            </form>

            <div className="space-y-2.5 pt-2">
              {localNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                    <span>{note.author}</span>
                    <span className="text-amber-700/70 font-normal">
                      {new Date(note.created_at).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Reprogramar Cita Odoo</span>
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Servicio</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {SERVICES_LIST.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} — ${s.price.toLocaleString('es-CO')} ({s.duration})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profesional</label>
                <select
                  value={selectedProfessional}
                  onChange={(e) => setSelectedProfessional(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {PROFESSIONALS_LIST.map((pro) => (
                    <option key={pro} value={pro}>
                      {pro}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {processingAction ? 'Guardando...' : 'Confirmar Reprogramación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">¿Cancelar Cita en Odoo?</h4>
                <p className="text-xs text-slate-500">Se liberará el cupo en el calendario.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Esta acción ejecutará la desvinculación en Odoo 17 y registrará la cancelación en el historial de WhatsApp.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl cursor-pointer text-xs"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={processingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-xs text-xs cursor-pointer disabled:opacity-50"
              >
                {processingAction ? 'Cancelando...' : 'Sí, Cancelar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
