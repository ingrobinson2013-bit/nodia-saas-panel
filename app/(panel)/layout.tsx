import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { 
  title: "BeautySync Pro+",
  description: "Panel de gestión WhatsApp Business AI"
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} flex h-screen bg-[#0f1117] overflow-hidden`}>
      <Sidebar />
      {/* On mobile: add bottom padding so content isn't hidden behind bottom nav */}
      <main className="flex-1 overflow-y-auto pb-[60px] md:pb-0">{children}</main>
    </div>
  );
}
