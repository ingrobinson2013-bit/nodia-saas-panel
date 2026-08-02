"use client";

import { useState, useEffect } from "react";
import { getTenantId, getTenantNombre } from "@/lib/tenant";
import {
  Megaphone, Upload, Send, CheckCircle2, AlertCircle,
  Clock, RefreshCw, Smartphone
} from "lucide-react";

interface ContactParsed {
  raw: string;
  phone: string;
  name: string;
  valid: boolean;
}

interface CampaignHistory {
  id?: string;
  name: string;
  total: number;
  sent: number;
  failed: number;
  date: string;
}

const PRESET_MESSAGES = [
  {
    title: "🚀 BeautySync Pro (TESO Consulting)",
    text: `Hola {nombre} 👋\n\nTe escribimos de TESO Consulting con una novedad importante.\n\nLanzamos BeautySync Pro: el primer software para barberías y salones que se subsidia con tus compras de insumos.\n\n✅ Agenda inteligente 24/7\n✅ Sitio Web y App de Reservas\n✅ Profesionales Ilimitados\n✅ Facturación electrónica DIAN (Opcional)\n✅ Control de inventario\n✅ Comisiones automatizadas\n\nActivación con la Compra de tus Insumos de las Marcas Aliadas\nSin mensualidades fijas. Pagas según tu volumen de Compra.\n\n¿Te gustaría conocer cómo funciona?`,
  },
  {
    title: "🎁 Descuento de Reagendamiento",
    text: "Hola {nombre}! 💇‍♀️ Notamos que hace tiempo no nos visitas en {negocio}. Te regalamos un 15% de descuento especial en tu próxima cita esta semana. ¿Te agendamos hoy mismo?",
  },
  {
    title: "✂️ Promoción de la Semana",
    text: "¡Hola {nombre}! ✂️ En {negocio} tenemos lugares disponibles para este fin de semana con atención prioritaria. ¿Te gustaría apartar tu cupo?",
  },
];

export default function CampanasPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [tenantNombre, setTenantNombre] = useState<string>("");
  
  // Form states
  const [campaignName, setCampaignName] = useState("Campaña Remarketing Scraping");
  const [rawInput, setRawInput] = useState("");
  const [messageType, setMessageType] = useState<"text" | "template">("template");
  const [messageText, setMessageText] = useState(PRESET_MESSAGES[0].text);
  const [templateName, setTemplateName] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [templatesError, setTemplatesError] = useState<boolean>(false);
  const [delaySeconds, setDelaySeconds] = useState<number>(1.0);

  // Parsed contacts state
  const [parsedContacts, setParsedContacts] = useState<ContactParsed[]>([]);
  
  // Execution states
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0 });
  const [sendResult, setSendResult] = useState<any>(null);
  const [history, setHistory] = useState<CampaignHistory[]>([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://nodia-saas-nodia-backend.gvle2r.easypanel.host";

  useEffect(() => {
    const tid = getTenantId();
    const tnom = getTenantNombre();
    setTenantId(tid);
    setTenantNombre(tnom || "Tu Negocio");
    if (tid) {
      fetchTemplates(tid);
      fetchCampaignHistory(tid);
    }
  }, []);

  // Fetch approved WhatsApp templates via API Route interna de Next.js (proxy seguro)
  // El token de Meta nunca se expone al cliente
  const fetchTemplates = async (tid: string) => {
    setLoadingTemplates(true);
    setTemplatesError(false);
    try {
      const res = await fetch(`/api/templates/${tid}`);
      if (res.ok) {
        const data = await res.json();
        const approved = (data.templates || []).filter((t: any) => t.status === "APPROVED");
        setAvailableTemplates(approved);
        if (approved.length > 0) {
          setTemplateName(approved[0].name);
        }
      } else {
        setAvailableTemplates([]);
        setTemplatesError(true);
      }
    } catch {
      setAvailableTemplates([]);
      setTemplatesError(true);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch campaign history
  const fetchCampaignHistory = async (tid: string) => {
    try {
      const res = await fetch(`/api/campaigns/list/${tid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.campaigns || []);
      }
    } catch {
      setHistory([]);
    }
  };

  // Parse raw contacts input (line by line or CSV format with smart header detection)
  useEffect(() => {
    if (!rawInput.trim()) {
      setParsedContacts([]);
      return;
    }

    const lines = rawInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setParsedContacts([]);
      return;
    }

    const parsed: ContactParsed[] = [];
    let nameIdx = 0;
    let phoneIdx = 1;
    let startLine = 0;

    // Detectar encabezado CSV
    const firstLineLower = lines[0].toLowerCase();
    const firstDelimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";

    if (
      firstLineLower.includes("nombre") ||
      firstLineLower.includes("name") ||
      firstLineLower.includes("cliente") ||
      firstLineLower.includes("telefono") ||
      firstLineLower.includes("phone") ||
      firstLineLower.includes("celular") ||
      firstLineLower.includes("whatsapp") ||
      firstLineLower.includes("numero")
    ) {
      startLine = 1; // Omitir la fila de encabezado
      const headers = lines[0].split(firstDelimiter).map((h) => h.trim().toLowerCase());
      headers.forEach((h, idx) => {
        if (h.includes("nombre") || h.includes("name") || h.includes("cliente") || h.includes("contacto")) {
          nameIdx = idx;
        }
        if (
          h.includes("telefono") ||
          h.includes("phone") ||
          h.includes("celular") ||
          h.includes("whatsapp") ||
          h.includes("numero") ||
          h.includes("mobile")
        ) {
          phoneIdx = idx;
        }
      });
    }

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const delimiter = line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
      const parts = line.split(delimiter).map((p) => p.trim());

      let name = "Cliente";
      let rawPhone = line;

      if (parts.length >= 2) {
        name = parts[nameIdx] !== undefined ? parts[nameIdx] : parts[0];
        rawPhone = parts[phoneIdx] !== undefined ? parts[phoneIdx] : parts[1];
      } else if (parts.length === 1) {
        rawPhone = parts[0];
      }

      // Manejar notación científica de Excel (ej: 5,73204E+11 o 5.73204E+11)
      let phoneStr = rawPhone;
      if (/[eE]\+?\d+/.test(phoneStr)) {
        try {
          const num = Number(phoneStr.replace(",", "."));
          if (!isNaN(num)) {
            phoneStr = num.toLocaleString("fullwide", { useGrouping: false });
          }
        } catch {}
      }

      // Sanitizar dígitos
      const cleanDigits = phoneStr.replace(/\D/g, "");
      let formatted = cleanDigits;
      let valid = false;

      if (cleanDigits.length === 10 && cleanDigits.startsWith("3")) {
        formatted = "57" + cleanDigits;
        valid = true;
      } else if (cleanDigits.length === 12 && cleanDigits.startsWith("573")) {
        valid = true;
      } else if (cleanDigits.length >= 9) {
        valid = true;
      }

      parsed.push({
        raw: line,
        phone: formatted,
        name: name || "Cliente",
        valid: valid,
      });
    }

    setParsedContacts(parsed);
  }, [rawInput]);

  // Consultar historial de remarketing enviado a los contactos ingresados
  const [historyMap, setHistoryMap] = useState<Record<string, any>>({});
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [checkingHistory, setCheckingHistory] = useState<boolean>(false);

  useEffect(() => {
    const validPhones = parsedContacts.filter((c) => c.valid).map((c) => c.phone);
    if (validPhones.length === 0 || !tenantId) {
      setHistoryMap({});
      return;
    }

    const checkHistory = async () => {
      setCheckingHistory(true);
      try {
        const res = await fetch(`/api/campaigns/check-contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_id: tenantId, phones: validPhones }),
        });
        if (res.ok) {
          const data = await res.json();
          setHistoryMap(data.results || {});
        }
      } catch {
        setHistoryMap({});
      } finally {
        setCheckingHistory(false);
      }
    };

    const timer = setTimeout(checkHistory, 500);
    return () => clearTimeout(timer);
  }, [parsedContacts, tenantId]);

  // Handle CSV / TXT file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawInput(content);
      }
    };
    reader.readAsText(file);
  };

  // Launch Campaign
  const handleLaunchCampaign = async () => {
    let validList = parsedContacts.filter((c) => c.valid);

    // Si la opción de omitir duplicados está activa, filtrar contactos con envío previo
    if (skipDuplicates) {
      validList = validList.filter((c) => !historyMap[c.phone]?.already_sent);
    }

    if (validList.length === 0) {
      alert("No hay contactos pendientes de envío (todos los ingresados ya recibieron remarketing previamente o son inválidos).");
      return;
    }
    if (validList.length === 0) {
      alert("Por favor ingresa al menos un número telefónico válido.");
      return;
    }

    if (!tenantId) {
      alert("No se identificó el negocio (tenant_id). Vuelve a iniciar sesión.");
      return;
    }

    if (messageType === "text" && !messageText.trim()) {
      alert("Por favor ingresa el texto del mensaje.");
      return;
    }

    if (messageType === "template" && !templateName) {
      alert("Por favor selecciona una plantilla de WhatsApp.");
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: validList.length, sent: 0, failed: 0 });
    setSendResult(null);

    const payload = {
      tenant_id: tenantId,
      campaign_name: campaignName.trim() || "Campaña Remarketing",
      message_type: messageType,
      message: messageText,
      template_name: templateName || undefined,
      contacts: validList.map((c) => ({ phone: c.phone, name: c.name })),
      delay_seconds: delaySeconds,
    };

    try {
      const res = await fetch(`/api/campaigns/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al enviar campaña");
      }

      setSendResult(data);
      // Refresh history
      fetchCampaignHistory(tenantId);
    } catch (err: any) {
      alert(`Error en la campaña: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const validCount = parsedContacts.filter((c) => c.valid).length;
  const invalidCount = parsedContacts.filter((c) => !c.valid).length;

  return (
    <div className="min-h-screen bg-[#04060c] text-white p-4 md:p-8">
      {/* ── HEADER DE SECCIÓN ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1117] via-[#111622] to-[#0d1117] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cargar Campaña Remarketing</h1>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full border border-indigo-500/30 font-semibold">
                  Scraping Outbound
                </span>
              </div>
              <p className="text-white/50 text-sm mt-1">
                Envía ofertas y mensajes masivos a números de clientes extraídos. Toda respuesta entra al Inbox en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL (GRID 2 COLUMNAS) ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: IMPORTAR NÚMEROS Y MENSAJE (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. SECCIÓN IMPORTAR CONTACTOS */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/20">
                  1
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">Importar Números (Scraping / Lista)</h2>
                  <p className="text-xs text-white/40">Pega números de WhatsApp o sube archivo CSV/TXT</p>
                </div>
              </div>

              {/* Botón Upload CSV */}
              <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-all">
                <Upload size={14} className="text-cyan-400" />
                Subir CSV / TXT
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Input Nombre de la Campaña */}
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                Nombre de la Campaña
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ej. Remarketing Clientes Junio"
                className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Textarea Números */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Lista de Números (un número por línea)
                </label>
                <span className="text-xs text-white/40">
                  Soporta: <code className="bg-white/10 px-1 py-0.5 rounded text-cyan-300">Juan, 3001234567</code> o <code className="bg-white/10 px-1 py-0.5 rounded text-cyan-300">3001234567</code>
                </span>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`Ejemplo:\n3001234567\nMaría Pérez, 3109876543\n+57 320 555 4433`}
                rows={6}
                className="w-full bg-[#131926] border border-white/10 rounded-xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Tip Excel Notación Científica */}
            <div className="bg-[#131926] border border-cyan-500/20 rounded-xl p-3 text-xs text-white/70 space-y-1">
              <p className="font-bold text-cyan-400 flex items-center gap-1.5">
                💡 Tip para guardar tu Excel en CSV sin errores de notación científica:
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Si los números en Excel se ven como <code className="bg-white/10 text-amber-300 px-1 py-0.5 rounded">5,73204E+11</code>, selecciona la Columna B (Teléfono) en Excel ➔ Clic derecho ➔ <strong>Formato de Celdas</strong> ➔ Clic en <strong>Número</strong> (pon 0 decimales) o <strong>Texto</strong> ➔ Luego guarda como CSV.
              </p>
            </div>

            {/* Resumen Sanitización y Filtro Histórico */}
            {parsedContacts.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 size={16} />
                      <span>{validCount - Object.keys(historyMap).length} Nuevos (Listos)</span>
                    </div>
                    {Object.keys(historyMap).length > 0 && (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        <Clock size={14} />
                        <span>{Object.keys(historyMap).length} Ya enviados previamente</span>
                      </div>
                    )}
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                        <AlertCircle size={16} />
                        <span>{invalidCount} Inválidos</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white/40">Total: {parsedContacts.length}</span>
                </div>

                {/* Checkbox Omitir Duplicados */}
                {Object.keys(historyMap).length > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300/90 font-medium bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded border-amber-500/40 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Omitir automáticamente contactos que ya hayan recibido remarketing previamente</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* 2. SECCIÓN CONFIGURAR MENSAJE */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                  2
                </div>
                <div>
                  <h2 className="font-bold text-lg text-white">Configurar Mensaje de Remarketing</h2>
                  <p className="text-xs text-white/40">Personaliza el contenido del mensaje directo</p>
                </div>
              </div>

              {/* Selector Tipo */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMessageType("text")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    messageType === "text" ? "bg-indigo-600 text-white shadow" : "text-white/50 hover:text-white"
                  }`}
                >
                  Mensaje Directo
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType("template")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    messageType === "template" ? "bg-indigo-600 text-white shadow" : "text-white/50 hover:text-white"
                  }`}
                >
                  Plantilla Meta
                </button>
              </div>
            </div>

            {/* Plantillas Rápidas Pre-construidas */}
            {messageType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">
                  Plantillas de Mensaje Sugeridas
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {PRESET_MESSAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageText(preset.text)}
                      className="text-left p-3 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                      <p className="text-xs font-bold text-indigo-300">{preset.title}</p>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-2">{preset.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Editor de Texto del Mensaje */}
            {messageType === "text" ? (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Cuerpo del Mensaje (Usa <code className="text-cyan-400">{"{nombre}"}</code> y <code className="text-cyan-400">{"{negocio}"}</code>)
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={5}
                  className="w-full bg-[#131926] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wider">
                  Seleccionar Plantilla Meta Aprobada
                </label>

                {loadingTemplates ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Cargando plantillas desde Meta...</span>
                  </div>
                ) : availableTemplates.length === 0 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-2">
                    {templatesError ? (
                      <>
                        <p className="text-rose-300 font-semibold">⚠️ No se pudo conectar con el servidor para cargar las plantillas.</p>
                        <p className="text-rose-200/70">Asegúrate de que el backend esté desplegado y luego haz clic en Reintentar.</p>
                        <button
                          onClick={() => tenantId && fetchTemplates(tenantId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-all"
                        >
                          <RefreshCw size={12} /> Reintentar
                        </button>
                      </>
                    ) : (
                      <p className="text-rose-300">⚠️ No se encontraron plantillas aprobadas en Meta. Usa el modo &quot;Mensaje Directo&quot;.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <select
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full bg-[#131926] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="">-- Selecciona una plantilla --</option>
                      {availableTemplates.map((tpl: any) => (
                        <option key={tpl.id || tpl.name} value={tpl.name}>
                          ✅ {tpl.name} ({tpl.language})
                        </option>
                      ))}
                    </select>

                    {templateName && (
                      <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                        ✨ <strong>Plantilla seleccionada:</strong>{" "}
                        {availableTemplates.find((t: any) => t.name === templateName)?.category || ""}{" "}
                        &mdash; Se enviará directamente al destinatario.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Configuración Pausa Anti-Spam */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Clock size={14} className="text-amber-400" />
                <span>Pausa Anti-Spam entre mensajes:</span>
              </div>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseFloat(e.target.value))}
                className="bg-[#131926] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value={0.5}>0.5 segundos (Rápido)</option>
                <option value={1.0}>1.0 segundo (Recomendado)</option>
                <option value={2.0}>2.0 segundos (Seguro)</option>
                <option value={3.0}>3.0 segundos (Ultra seguro)</option>
              </select>
            </div>
          </div>

          {/* 3. BOTÓN LANZAR CAMPAÑA */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-base">¿Listo para enviar?</p>
              <p className="text-xs text-white/50">
                Se enviarán <strong className="text-emerald-400">{validCount}</strong> mensajes desde WhatsApp Cloud API.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchCampaign}
              disabled={sending || validCount === 0}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg ${
                sending || validCount === 0
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 active:scale-95"
              }`}
            >
              {sending ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Enviando Campaña...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Lanzar Campaña Masiva
                </>
              )}
            </button>
          </div>

          {/* RESULTADO DE ENVÍO */}
          {sendResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-emerald-400 mb-3">
                <CheckCircle2 size={24} />
                <h3 className="font-bold text-lg">¡Campaña Completada Exitosamente!</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center bg-black/40 p-4 rounded-xl text-xs">
                <div>
                  <p className="text-white/40">Total</p>
                  <p className="text-lg font-extrabold text-white">{sendResult.total}</p>
                </div>
                <div>
                  <p className="text-white/40">Enviados OK</p>
                  <p className="text-lg font-extrabold text-emerald-400">{sendResult.sent}</p>
                </div>
                <div>
                  <p className="text-white/40">Fallidos</p>
                  <p className="text-lg font-extrabold text-rose-400">{sendResult.failed}</p>
                </div>
              </div>
              <p className="text-xs text-white/60 mt-3 text-center">
                Los clientes que respondan aparecerán automáticamente en el <strong className="text-white">Inbox</strong>.
              </p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: PREVIEW EN SMARTPHONE + HISTORIAL (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* PREVIEW EN TELÉFONO WHATSAPP */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-emerald-400" />
                <span className="font-bold text-sm text-white">Vista Previa WhatsApp</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                En vivo
              </span>
            </div>

            {/* MOCKUP DE IPHONE / WHATSAPP */}
            <div className="w-[280px] bg-[#09141a] rounded-[32px] border-4 border-[#1f2937] overflow-hidden shadow-2xl relative">
              {/* Status bar */}
              <div className="bg-[#0b141a] px-4 py-2 flex items-center justify-between text-[10px] text-white/50 border-b border-white/5">
                <span>9:41</span>
                <span className="font-semibold text-emerald-400">{tenantNombre}</span>
                <span>100%</span>
              </div>

              {/* Chat Body */}
              <div className="p-4 min-h-[280px] bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:12px_12px] flex flex-col justify-end">
                {/* Bubble message */}
                <div className="bg-[#005c4b] text-white p-2.5 rounded-2xl rounded-tr-none text-xs shadow-md space-y-2 relative max-w-[95%] self-end">
                  {messageType === "template" && templateName === "contacto_inicial_beautysyncpro" ? (
                    <>
                      <img
                        src="https://blog.tesoconsulting.co/wp-content/uploads/2026/05/BeautySync_History_Meta.webp"
                        alt="Header"
                        className="w-full h-28 object-cover rounded-xl border border-white/10"
                      />
                      <p className="leading-snug text-[11px] whitespace-pre-wrap">
                        Hola {parsedContacts[0]?.name || "Robinson"} 👋<br/><br/>
                        Te escribimos de TESO Consulting con una novedad importante.<br/><br/>
                        Lanzamos <strong>BeautySync Pro</strong>: el primer software para barberías y salones que se subsidia con tus compras de insumos.<br/><br/>
                        ✅ Agenda inteligente 24/7<br/>
                        ✅ Sitio Web y App de Reservas<br/>
                        ✅ Profesionales Ilimitados<br/><br/>
                        ¿Te gustaría conocer cómo funciona?
                      </p>
                    </>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {messageText
                        .replace("{nombre}", parsedContacts[0]?.name || "María")
                        .replace("{negocio}", tenantNombre || "Jose Peluqueria")}
                    </p>
                  )}
                  <div className="text-[9px] text-emerald-200/70 text-right flex items-center justify-end gap-1 mt-1">
                    <span>9:41 AM</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>

              {/* Mock input bar */}
              <div className="bg-[#1f2c34] p-2 flex items-center gap-2 text-white/30 text-xs border-t border-white/5">
                <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1 text-[10px] text-white/40">
                  Escribe un mensaje...
                </div>
              </div>
            </div>

            <p className="text-[11px] text-white/40 mt-4 text-center">
              Así visualizará el cliente el mensaje en su teléfono.
            </p>
          </div>

          {/* HISTORIAL DE CAMPAÑAS PASADAS */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                Historial de Campañas
              </h3>
              <button
                onClick={() => fetchCampaignHistory(tenantId)}
                className="text-xs text-white/40 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Actualizar
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-white/30 text-xs">
                No has realizado campañas de remarketing aún.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {history.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-white/40">
                        {item.date ? new Date(item.date).toLocaleDateString("es-CO") : "Reciente"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        {item.sent || item.total} enviados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
