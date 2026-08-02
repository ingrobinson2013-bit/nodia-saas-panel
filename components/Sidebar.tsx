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
      {/* ── DESKTOP SIDEBAR (≥ md - 210px SLEEK LINEAR STYLE) ── */}
      <aside className="hidden md:flex w-[210px] bg-[#07090e] border-r border-white/5 flex-col h-screen sticky top-0 z-30 select-none">
        {/* Brand Header */}
        <div className="p-3.5 border-b border-white/5 bg-[#0b0f19]/60">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <img
                src="/logo.jpg"
                alt="BeautySync Pro"
                className="w-9 h-9 rounded-xl object-cover border border-amber-500/30 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#07090e] rounded-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-white text-[13px] tracking-tight truncate leading-none">
                  BeautySync
                </span>
                <span className="px-1 py-0.5 rounded text-[8.5px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider shrink-0">
                  PRO
                </span>
              </div>
              <p className="text-[9.5px] text-cyan-400 font-semibold tracking-wider uppercase mt-1 flex items-center gap-1">
                <Sparkles size={8} /> Ecosystem IA
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          <p className="px-3 text-[9.5px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Navegación
          </p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={withTenant(href)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
                  active
                    ? "bg-white/[0.08] text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                <Icon
                  size={16}
                  className={`transition-colors shrink-0 ${
                    active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"
                  }`}
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout Footer */}
        <div className="p-2.5 border-t border-white/5 bg-[#0b0f19]/40">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut size={15} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM BAR (< md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07090e]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2 shadow-2xl">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={withTenant(href)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${
                active ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Icon size={18} className={active ? "text-cyan-400" : "text-slate-400"} />
              <span className="text-[9px] font-semibold tracking-tight">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}


