"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantId } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare, BarChart3, Users, Megaphone, Settings, LogOut, Sparkles
} from "lucide-react";

const navItems = [
  { href: "/inbox",     icon: MessageSquare, label: "Inbox Chat" },
  { href: "/dashboard", icon: BarChart3,     label: "Reportes & IA" },
  { href: "/contactos", icon: Users,         label: "CRM Contactos" },
  { href: "/campanas",  icon: Megaphone,     label: "Campañas WhatsApp" },
  { href: "/config",    icon: Settings,      label: "Configuración" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    setTenantId(getTenantId());
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem('nodia_tenant_id');
    localStorage.removeItem('nodia_tenant_nombre');
    localStorage.removeItem('nodia_tenant_plan');
    localStorage.removeItem('bsp_tenant_id');
    localStorage.removeItem('bsp_tenant_nombre');
    sessionStorage.removeItem('bsp_config_unlocked');
    router.push('/login');
  }

  const withTenant = (href: string) =>
    tenantId ? `${href}?tenant=${tenantId}` : href;

  return (
    <>
      {/* ── DESKTOP SIDEBAR (≥ md) ── */}
      <aside className="hidden md:flex w-[240px] bg-[#070a14] border-r border-amber-500/10 flex-col h-screen sticky top-0 z-30 select-none shadow-2xl">
        {/* Brand Header */}
        <div className="p-4 border-b border-amber-500/10 relative overflow-hidden bg-gradient-to-b from-[#0e172a]/60 to-[#070a14]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="/logo.jpg"
                alt="BeautySync Pro"
                className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-lg shadow-amber-500/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#070a14] rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-[14px] tracking-tight truncate leading-none">
                  BeautySync
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-black tracking-wider shadow-sm shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase mt-1 flex items-center gap-1">
                <Sparkles size={9} /> Ecosystem IA
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Panel Principal
          </p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={withTenant(href)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors shrink-0 ${
                    active ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"
                  }`}
                />
                <span className="truncate">{label}</span>
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full shadow-md shadow-amber-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Logout Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0a0f1d]/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM BAR (< md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070a14]/95 backdrop-blur-xl border-t border-amber-500/20 flex items-center justify-around px-2 py-2 shadow-2xl">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={withTenant(href)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all ${
                active ? "text-amber-400" : "text-slate-400"
              }`}
            >
              <Icon size={19} className={active ? "text-amber-400" : "text-slate-400"} />
              <span className="text-[9.5px] font-bold tracking-tight">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

