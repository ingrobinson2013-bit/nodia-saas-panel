'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import {
  Calendar,
  Sparkles,
  User,
  Bot,
  Play,
  Pause,
  CheckCheck,
  X,
  Mic,
  AlertTriangle,
  Flame,
  Clock,
} from 'lucide-react';
import { formatTimeBogota, formatDateLabel, bogotaDateStr } from '@/lib/inbox-utils';

interface ChatFeedProps {
  messages: Message[];
  isHumanMode: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onSendOfficialTemplate?: (templateName: string) => Promise<void>;
  metaErrorMessage?: string | null;
  onClearMetaError?: () => void;
}

export default function ChatFeed({
  messages,
  isHumanMode,
  messagesEndRef,
  onSendOfficialTemplate,
  metaErrorMessage,
  onClearMetaError,
}: ChatFeedProps) {
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<'1.0x' | '1.5x' | '2.0x'>('1.0x');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const toggleAudio = (id: number) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioSpeed === '1.0x') setAudioSpeed('1.5x');
    else if (audioSpeed === '1.5x') setAudioSpeed('2.0x');
    else setAudioSpeed('1.0x');
  };

  // Check if 24 hours have passed since last user message
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1];
  const is24hWindowClosed = lastUserMsg?.timestamp
    ? Date.now() - new Date(lastUserMsg.timestamp).getTime() > 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {/* Human Takeover Notice Banner */}
      {isHumanMode && (
        <div className="sticky top-0 z-10 mx-auto max-w-md mb-3">
          <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center justify-between border border-amber-400 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              <span>⚡ Modo Asesor Humano Activo (IA en Pausa)</span>
            </div>
            <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded font-mono font-bold">
              MANUAL
            </span>
          </div>
        </div>
      )}

      {/* Meta Error Banner (e.g. 24h Window Rejection) */}
      {metaErrorMessage && (
        <div className="sticky top-2 z-20 mx-auto max-w-lg mb-3">
          <div className="bg-rose-50 border-2 border-rose-300 text-rose-950 p-3.5 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>⚠️ Error de Entrega Meta WhatsApp</span>
              </div>
              {onClearMetaError && (
                <button
                  onClick={onClearMetaError}
                  className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              {metaErrorMessage}
            </p>
            {onSendOfficialTemplate && (
              <div className="pt-2 border-t border-rose-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onClearMetaError) onClearMetaError();
                    onSendOfficialTemplate('contacto_inicial_beautysyncpro');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>🚀 Reabrir con Plantilla Oficial Meta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Feed with Dynamic Date Separators */}
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const contentStr = msg.content || '';

        // Check if date changed from previous message
        const currentMsgDate = msg.timestamp ? bogotaDateStr(new Date(msg.timestamp)) : '';
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const prevMsgDate = prevMsg?.timestamp ? bogotaDateStr(new Date(prevMsg.timestamp)) : '';
        const showDateSeparator = index === 0 || (currentMsgDate && currentMsgDate !== prevMsgDate);

        // Detection of voice notes / audio
        const isAudio =
          contentStr.startsWith('[AUDIO]') ||
          contentStr.includes('🎙️') ||
          contentStr.toLowerCase().includes('nota de voz') ||
          contentStr.includes('.ogg') ||
          contentStr.includes('.mp3') ||
          contentStr.includes('.m4a');

        // Clean transcription text if it has voice markers
        const cleanTranscription = contentStr
          .replace(/^\[AUDIO\]\s*/i, '')
          .replace(/^🎙️\s*\[?nota de voz\]?:?\s*/i, '')
          .trim();

        const messageTime =
          formatTimeBogota(msg.timestamp) ||
          formatTimeBogota(new Date().toISOString());

        let isJsonAction = false;
        let actionPayload: any = null;
        try {
          const parsed = JSON.parse(contentStr);
          if (parsed && (parsed.action || parsed.service || parsed.date)) {
            isJsonAction = true;
            actionPayload = parsed;
          }
        } catch {}

        return (
          <React.Fragment key={index}>
            {/* Dynamic Date Separator Pill */}
            {showDateSeparator && (
              <div className="flex justify-center my-3">
                <span className="bg-slate-200/90 text-slate-700 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs border border-slate-300/60">
                  {formatDateLabel(msg.timestamp || new Date().toISOString())}
                </span>
              </div>
            )}

            {isJsonAction ? (
              <div className="flex justify-center my-2">
                <div className="bg-white border border-blue-200 text-blue-900 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-3 shadow-xs max-w-md">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 text-xs">
                        {actionPayload.action === 'BOOK'
                          ? '✨ Agendamiento en Odoo'
                          : actionPayload.action === 'CANCEL'
                          ? '✕ Cancelación de Cita'
                          : 'Acción de Sistema'}
                      </p>
                      <span className="text-[9px] text-slate-400 font-semibold">{messageTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {actionPayload.name && (
                        <span>
                          Cliente: <strong>{actionPayload.name}</strong> •{' '}
                        </span>
                      )}
                      {actionPayload.date && (
                        <span>
                          Fecha:{' '}
                          <strong>
                            {actionPayload.date} {actionPayload.time || ''}
                          </strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`flex ${isUser ? 'justify-start' : 'justify-end'} items-end gap-2`}
              >
                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mb-1 border border-slate-300 text-xs font-semibold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs md:text-sm shadow-xs transition-all ${
                    isUser
                      ? 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                      : 'bg-emerald-600 text-white rounded-br-xs'
                  }`}
                >
                  {/* WhatsApp Audio & Voice Note Player */}
                  {isAudio ? (
                    <div className="space-y-2 min-w-[240px] max-w-sm">
                      {/* Header Badge */}
                      <div
                        className={`flex items-center justify-between pb-1.5 border-b text-[10px] font-bold ${
                          isUser
                            ? 'border-slate-100 text-slate-600'
                            : 'border-emerald-500/40 text-emerald-100'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5 text-emerald-500" /> Nota de Voz WhatsApp
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isUser
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-emerald-700/60 text-emerald-100'
                          }`}
                        >
                          Whisper AI
                        </span>
                      </div>

                      {/* Waveform Player */}
                      <div className="flex items-center gap-3 py-1">
                        <button
                          type="button"
                          onClick={() => toggleAudio(index)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs flex-shrink-0 ${
                            isUser
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-white text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {playingAudioId === index ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-0.5 h-6">
                            {[40, 65, 30, 85, 50, 95, 70, 35, 60, 100, 45, 80, 30, 65, 90, 40].map(
                              (h, i) => (
                                <span
                                  key={i}
                                  className={`w-1 rounded-full transition-all ${
                                    isUser
                                      ? playingAudioId === index && i < 10
                                        ? 'bg-emerald-600'
                                        : 'bg-slate-300'
                                      : playingAudioId === index && i < 10
                                      ? 'bg-white'
                                      : 'bg-emerald-300/60'
                                  }`}
                                  style={{ height: `${h}%` }}
                                />
                              )
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] opacity-85">
                            <span className="font-mono">0:14</span>
                            <button
                              type="button"
                              onClick={cycleSpeed}
                              className={`font-bold px-1 rounded hover:underline cursor-pointer ${
                                isUser ? 'bg-slate-100 text-slate-700' : 'bg-emerald-700/50 text-white'
                              }`}
                            >
                              {audioSpeed}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Transcribed Text Container */}
                      {cleanTranscription && (
                        <div
                          className={`p-2.5 rounded-xl text-xs leading-relaxed border ${
                            isUser
                              ? 'bg-slate-50 border-slate-200/80 text-slate-800'
                              : 'bg-emerald-700/50 border-emerald-500/40 text-emerald-50'
                          }`}
                        >
                          <p className="font-semibold text-[10px] uppercase tracking-wider mb-0.5 opacity-75">
                            Transcripción:
                          </p>
                          <p className="italic font-normal">"{cleanTranscription}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{contentStr}</p>
                  )}

                  {/* Exact Message Timestamp (Hour & Minute in Bogota Time) */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                      isUser ? 'text-slate-400' : 'text-emerald-100'
                    }`}
                  >
                    <span className="font-medium">{messageTime}</span>
                    {!isUser && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                  </div>
                </div>

                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 mb-1 border border-emerald-600 text-xs font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* 24-Hour Meta Policy Notice Banner */}
      {is24hWindowClosed && (
        <div className="mx-auto max-w-lg my-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs text-xs text-amber-900 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
              24h
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">Ventana de 24 Horas de Meta Inactiva</p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Han pasado más de 24 horas desde la última respuesta del cliente. Meta no permite enviar mensajes de texto libres. Para reanudar el contacto, envía una <strong>Plantilla Oficial de Meta</strong>.
              </p>
            </div>
          </div>
          {onSendOfficialTemplate && (
            <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-amber-200/60">
              <button
                type="button"
                onClick={() => onSendOfficialTemplate('contacto_inicial_beautysyncpro')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>🚀 Enviar Contacto Inicial Meta</span>
              </button>
            </div>
          )}
        </div>
      )}

      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white p-1 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Vista previa"
              className="rounded-xl max-h-[85vh] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
