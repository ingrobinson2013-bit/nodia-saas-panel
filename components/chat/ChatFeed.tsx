'use client';

import React, { useState, RefObject } from 'react';
import { Message } from '@/lib/types';
import {
  Bot,
  User,
  CheckCheck,
  Sparkles,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  X,
} from 'lucide-react';
import { formatTimeBogota, formatDateLabel } from '@/lib/inbox-utils';

interface ChatFeedProps {
  messages: Message[];
  isHumanMode: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export default function ChatFeed({
  messages,
  isHumanMode,
  messagesEndRef,
}: ChatFeedProps) {
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<string>('1x');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const toggleAudio = (index: number) => {
    setPlayingAudioId((prev) => (prev === index ? null : index));
  };

  const cycleSpeed = () => {
    if (audioSpeed === '1x') setAudioSpeed('1.5x');
    else if (audioSpeed === '1.5x') setAudioSpeed('2x');
    else setAudioSpeed('1x');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#F8FAFC] relative select-none">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Sticky Takeover Alert */}
      {isHumanMode && (
        <div className="flex justify-center sticky top-2 z-10">
          <div className="bg-amber-50 border border-amber-300/80 text-amber-900 text-xs font-medium px-4 py-1.5 rounded-full shadow-xs flex items-center gap-2 backdrop-blur-xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Modo Humano Activado — La IA está pausada para este cliente</span>
          </div>
        </div>
      )}

      {/* Date Header Pill */}
      <div className="flex justify-center my-2">
        <span className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
          {formatDateLabel(new Date().toISOString())}
        </span>
      </div>

      {/* Messages Feed */}
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isAudio =
          msg.content.startsWith('[AUDIO]') ||
          msg.content.includes('.ogg') ||
          msg.content.includes('.mp3');

        const messageTime =
          formatTimeBogota(msg.timestamp) ||
          formatTimeBogota(new Date().toISOString());

        let isJsonAction = false;
        let actionPayload: any = null;
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed && (parsed.action || parsed.service || parsed.date)) {
            isJsonAction = true;
            actionPayload = parsed;
          }
        } catch {}

        if (isJsonAction) {
          return (
            <div key={index} className="flex justify-center my-2">
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
          );
        }

        const isTemplate =
          msg.content.includes('¡Tu pedido ha sido') ||
          msg.content.includes('¡Tu cita ha sido') ||
          msg.content.includes('Gracias por confiar');

        return (
          <div
            key={index}
            className={`flex ${isUser ? 'justify-start' : 'justify-end'} items-end gap-2`}
          >
            {isUser && (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mb-1 border border-slate-300 text-xs font-semibold">
                <User className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs md:text-sm shadow-xs transition-all ${
                isUser
                  ? 'bg-white text-slate-800 rounded-bl-xs border border-slate-200'
                  : isTemplate
                  ? 'bg-[#E7F8E8] border border-[#B7EB8F] text-[#135200] rounded-br-xs'
                  : 'bg-emerald-600 text-white rounded-br-xs'
              }`}
            >
              {isTemplate && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/70 text-[10px] font-bold text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Plantilla Oficial WhatsApp
                  </span>
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded text-[9px]">Aprobada</span>
                </div>
              )}

              {isAudio ? (
                <div className="flex items-center gap-3 py-1 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => toggleAudio(index)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isUser
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-xs'
                    }`}
                  >
                    {playingAudioId === index ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-0.5 h-5">
                      {[40, 60, 30, 80, 50, 90, 70, 30, 60, 100, 45, 75, 30, 60].map((h, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            isUser
                              ? playingAudioId === index && i < 8
                                ? 'bg-emerald-600'
                                : 'bg-slate-300'
                              : playingAudioId === index && i < 8
                              ? 'bg-white'
                              : 'bg-emerald-300/60'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span>0:18</span>
                      <button
                        type="button"
                        onClick={cycleSpeed}
                        className="font-bold hover:underline cursor-pointer"
                      >
                        {audioSpeed}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}

              {/* Exact Message Timestamp (Hour & Minute in Bogota Time) */}
              <div
                className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                  isUser ? 'text-slate-400' : isTemplate ? 'text-emerald-700' : 'text-emerald-100'
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
        );
      })}

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
