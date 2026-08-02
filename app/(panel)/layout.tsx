import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { 
  title: "BeautySync Pro — Ecosystem Inteligente",
  description: "Panel CRM Multi-Tenant & Agente IA para Barberías y Salones"
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} flex h-screen bg-[#060913] text-slate-100 overflow-hidden antialiased`}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-[64px] md:pb-0 relative">{children}</main>
    </div>
  );
}

