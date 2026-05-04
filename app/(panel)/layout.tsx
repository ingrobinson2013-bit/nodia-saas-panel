import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "NODIA Panel" };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} flex h-screen bg-[#0f1117] overflow-hidden`}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
