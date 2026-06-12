"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle, Settings, Users, BarChart3,
  Megaphone, Bot, LogOut
} from "lucide-react";

const nav = [
  { href: "/inbox",     icon: MessageCircle, label: "Inbox" },
  { href: "/dashboard", icon: BarChart3,     label: "Reportes" },
  { href: "/contactos", icon: Users,         label: "Contactos" },
  { href: "/campanas",  icon: Megaphone,     label: "Campañas" },
  { href: "/config",    icon: Settings,      label: "Configuración" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[220px] bg-[#0a0d14] border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-white text-[15px] leading-none">BeautySync Pro</p>
            <p className="text-[11px] text-white/30 font-medium mt-0.5">Chat</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
