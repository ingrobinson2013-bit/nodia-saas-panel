"use client";
import { useEffect, useState } from "react";
import { MessageCircle, CheckCircle, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window { FB: any; }
}

interface Props {
  tenantId: string;
  onConnected: (phoneId: string) => void;
}

type Status = "idle" | "loading" | "success" | "error";

export default function WhatsAppConnect({ tenantId, onConnected }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Cargar Facebook SDK
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/es_LA/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.FB?.init({
        appId:   process.env.NEXT_PUBLIC_META_APP_ID,
        version: "v19.0",
        cookie:  true,
        xfbml:   true,
      });
    };
  }, []);

  const handleConnect = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID;

    if (!appId || !configId || configId.includes("TU_CONFIG_ID")) {
      setErrorMsg("Error: Faltan configurar las variables de entorno de Meta (App ID o Config ID) en el servidor.");
      setStatus("error");
      return;
    }

    if (!window.FB) {
      setErrorMsg("SDK de Meta no cargó. Recarga la página.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    window.FB.login(
      (response: any) => {
        if (!response.authResponse?.code) {
          setStatus("idle");
          return; // Usuario canceló
        }

        const code = response.authResponse.code;

        // Ejecutar proceso asíncrono internamente
        (async () => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/meta-connect`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: tenantId, code }),
              }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Error del servidor");

            setStatus("success");
            onConnected(data.phone_number_id);
          } catch (err: any) {
            setErrorMsg(err.message);
            setStatus("error");
          }
        })();
      },
      {
        config_id: configId, // Config de Embedded Signup
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureName: "whatsapp_embedded_signup",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      {status === "success" ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <CheckCircle size={20} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-400">¡WhatsApp conectado exitosamente!</p>
            <p className="text-xs text-white/40 mt-0.5">Tu número ya está activo en BeautySync Pro+</p>
          </div>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={status === "loading"}
          className="flex items-center gap-3 px-6 py-3.5 bg-[#25D366] hover:bg-[#1EBE5A] disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30 w-full justify-center"
        >
          {status === "loading" ? (
            <><Loader2 size={18} className="animate-spin" /> Conectando con Meta...</>
          ) : (
            <><MessageCircle size={18} /> Conectar mi WhatsApp Business</>
          )}
        </button>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="text-center space-y-1.5 p-3 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-[11px] text-amber-400/90 font-medium leading-relaxed">
          ⚠️ El número no debe estar activo en WhatsApp en ningún celular. Elimina la cuenta desde el celular antes de continuar.
        </p>
        <p className="text-[10px] text-white/30">
          Se abrirá una ventana de Meta para autorizar tu número de WhatsApp Business.
        </p>
      </div>
    </div>
  );
}
