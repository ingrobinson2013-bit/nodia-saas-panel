"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantId } from "@/lib/tenant";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle, Settings, Users, BarChart3,
  Megaphone, LogOut
} from "lucide-react";

const navItems = [
  { href: "/inbox",     icon: MessageCircle, label: "Inbox" },
  { href: "/dashboard", icon: BarChart3,     label: "Reportes" },
  { href: "/contactos", icon: Users,         label: "Contactos" },
  { href: "/campanas",  icon: Megaphone,     label: "Campañas" },
  { href: "/config",    icon: Settings,      label: "Config" },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    setTenantId(getTenantId());
  }, []);

  async function handleLogout() {
    // 1. Cerrar sesión en Supabase Auth
    await supabase.auth.signOut();
    // 2. Limpiar TODO el localStorage
    localStorage.removeItem('nodia_tenant_id');
    localStorage.removeItem('nodia_tenant_nombre');
    localStorage.removeItem('nodia_tenant_plan');
    localStorage.removeItem('bsp_tenant_id');
    localStorage.removeItem('bsp_tenant_nombre');
    // 3. Limpiar sessionStorage (config lock)
    sessionStorage.removeItem('bsp_config_unlocked');
    // 4. Redirigir al login
    router.push('/login');
  }

  // Always append ?tenant= to every nav link so the tenant survives navigation
  const withTenant = (href: string) =>
    tenantId ? `${href}?tenant=${tenantId}` : href;

  return (
    <>
      {/* ── DESKTOP sidebar (≥ md) ── */}
      <aside className="hidden md:flex w-[220px] bg-[#0a0d14] border-r border-white/5 flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="NODIA" className="w-9 h-9 rounded-xl object-cover border border-white/10" />
            <div>
              <p className="font-extrabold text-white text-[15px] leading-none">BeautySync Pro</p>
              <p className="text-[11px] text-white/30 font-medium mt-0.5">Chat</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={withTenant(href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MOBILE bottom nav (< md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0d14]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={withTenant(href)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-cyan-400" : "text-white/30"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
