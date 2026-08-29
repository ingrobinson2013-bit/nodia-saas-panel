'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatSession, Message } from '@/lib/types';
import { getTenantId } from '@/lib/tenant';
import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/inbox/ConversationList';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatFeed from '@/components/chat/ChatFeed';
import TagPipelineBar from '@/components/chat/TagPipelineBar';
import MessageComposer from '@/components/chat/MessageComposer';
import CustomerCrmPanel from '@/components/crm/CustomerCrmPanel';
import { getClientName } from '@/lib/inbox-utils';

export default function InboxPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showCrmPanel, setShowCrmPanel] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'crm'>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>(['cita_confirmada']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch sessions from Supabase
  const fetchSessions = useCallback(async (tid?: string, silent = false) => {
    const activeTid = tid || tenantId;
    if (!activeTid) return;
    if (!silent) setLoading(true);

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('tenant_id', activeTid)
        .not('estado', 'in', '(archivado,cerrado)')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      const loaded = (data as ChatSession[]) || [];
      setSessions(loaded);

      if (!silent) {
        setActiveSession((prev) => prev || loaded[0] || null);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Read tenant query param or storage on mount
  useEffect(() => {
    let tid = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      tid = params.get('tenant') || '';
    }
    if (!tid) tid = getTenantId();
    if (tid) {
      setTenantId(tid);
      fetchSessions(tid);
    } else {
      setLoading(false);
    }
  }, [fetchSessions]);

  // Supabase Realtime WebSocket subscription
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`chat_sessions_realtime_${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const updated = payload.new as ChatSession;
          if (!updated) return;
          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [updated, ...prev];
          });
          setActiveSession((curr) => (curr?.id === updated.id ? updated : curr));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.history?.length]);

  // Select session with mobile view switch
  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session);
    setMobileView('chat');
  };

  // Toggle Bot Mode
  const toggleBotMode = async (session: ChatSession) => {
    const newMode = !session.bot_mode;
    setActiveSession((prev) => (prev ? { ...prev, bot_mode: newMode } : null));
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, bot_mode: newMode } : s))
    );

    await supabase
      .from('chat_sessions')
      .update({ bot_mode: newMode, updated_at: new Date().toISOString() })
      .eq('id', session.id);
  };

  // Send WhatsApp message
  const handleSendMessage = async (text: string) => {
    if (!activeSession || !text.trim() || sendingMsg) return;
    setSendingMsg(true);

    const optimisticMsg: Message = {
      role: 'agent',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...(activeSession.history || []), optimisticMsg];

    setActiveSession({ ...activeSession, history: newHistory });
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? { ...s, history: newHistory } : s))
    );

    try {
      await supabase
        .from('chat_sessions')
        .update({
          history: newHistory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeSession.id);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleToggleTag = async (tagKey: string) => {
    const newTags = selectedTags.includes(tagKey)
      ? selectedTags.filter((t) => t !== tagKey)
      : [...selectedTags, tagKey];

    setSelectedTags(newTags);

    if (activeSession) {
      try {
        await fetch('/api/update-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSession.id, tags: newTags }),
        });
      } catch (e) {
        console.error('Error updating tag:', e);
      }
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-xs font-semibold">Cargando NODIA Chat Pro...</p>
        </div>
      </div>
    );
  }

  const handleSendOfficialTemplate = async (templateName: string) => {
    if (!activeSession || !tenantId) return;

    try {
      const res = await fetch('/api/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          session_id: activeSession.id,
          wa_to: activeSession.wa_from,
          template_name: templateName,
          client_name: getClientName(activeSession) || 'Cliente',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`Error de Meta WhatsApp: ${data.error || 'No se pudo enviar la plantilla'}`);
        return;
      }

      await fetchSessions(tenantId, true);
    } catch (err: any) {
      console.error('Error sending official template:', err);
      alert(`Error de conexión al enviar plantilla: ${err.message}`);
    }
  };

  const isHumanMode = !!activeSession && !activeSession.bot_mode;
  const messages = activeSession?.history?.filter((m) => m.role !== 'system') || [];

  return (
    <div className="flex h-screen bg-white font-sans text-slate-800 overflow-hidden select-none">
      {/* Column 1: Conversations List (Visible on desktop or when mobileView === 'list') */}
      <div
        className={`${
          mobileView === 'list' ? 'flex w-full' : 'hidden'
        } md:flex md:w-80 lg:w-88 xl:w-96 flex-shrink-0 h-full`}
      >
        <ConversationList
          sessions={sessions}
          activeSessionId={activeSession?.id || null}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* Column 2: Central Chat View (Visible on desktop or when mobileView === 'chat') */}
      <main
        className={`${
          mobileView === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col min-w-0 bg-[#F8FAFC] h-full`}
      >
        {activeSession ? (
          <>
            <ChatHeader
              session={activeSession}
              onToggleBot={toggleBotMode}
              showCrmPanel={showCrmPanel}
              onToggleCrmPanel={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setMobileView('crm');
                } else {
                  setShowCrmPanel(!showCrmPanel);
                }
              }}
              onBackToList={() => setMobileView('list')}
            />

            <ChatFeed
              messages={messages}
              isHumanMode={isHumanMode}
              messagesEndRef={messagesEndRef}
            />

            <TagPipelineBar
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
            />

            <MessageComposer
              onSendMessage={handleSendMessage}
              onSendOfficialTemplate={handleSendOfficialTemplate}
              sending={sendingMsg}
              isHumanMode={isHumanMode}
              onActivateHumanMode={() => toggleBotMode(activeSession)}
              clientName={getClientName(activeSession)}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Bandeja de Entrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Selecciona una conversación para interactuar con el cliente y visualizar su historial de Odoo.
            </p>
          </div>
        )}
      </main>

      {/* Column 3: CRM & Appointments Panel (Visible on desktop when showCrmPanel or when mobileView === 'crm') */}
      {activeSession && (
        <div
          className={`${
            mobileView === 'crm' ? 'flex w-full fixed inset-0 z-30' : showCrmPanel ? 'hidden md:flex' : 'hidden'
          } md:relative md:w-80 lg:w-88 flex-shrink-0 h-full`}
        >
          <CustomerCrmPanel
            session={activeSession}
            onUpdateSession={() => fetchSessions(tenantId, true)}
            onCloseMobile={() => setMobileView('chat')}
          />
        </div>
      )}
    </div>
  );
}
