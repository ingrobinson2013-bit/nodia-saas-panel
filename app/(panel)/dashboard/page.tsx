// app/(panel)/dashboard/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTenantId } from "@/lib/tenant";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    const tid = getTenantId();
    // Redirigir al inbox mientras el dashboard se implementa
    router.replace(`/inbox${tid ? `?tenant=${tid}` : ""}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#04060c] text-white flex items-center justify-center">
      <div className="text-center text-white/40">
        <p className="text-sm">Cargando Reportes...</p>
      </div>
    </div>
  );
}
