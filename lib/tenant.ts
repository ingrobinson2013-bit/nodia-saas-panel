// lib/tenant.ts
// Helper para obtener el tenant_id del usuario autenticado
// En localStorage (client-side) o del env (fallback para desarrollo local)

export function getTenantId(): string {
  if (typeof window !== 'undefined') {
    // 1. Check URL query param first for debug/admin override
    const params = new URLSearchParams(window.location.search);
    const urlTenant = params.get('tenant') || params.get('tenant_id');
    if (urlTenant) {
      localStorage.setItem('nodia_tenant_id', urlTenant);
      return urlTenant;
    }

    // 2. Check localStorage
    const stored = localStorage.getItem('nodia_tenant_id');
    if (stored) return stored;
  }
  // Fallback para desarrollo local con .env
  return process.env.NEXT_PUBLIC_TENANT_ID || '';
}

export function getTenantNombre(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nodia_tenant_nombre') || '';
  }
  return '';
}

export function getTenantPlan(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nodia_tenant_plan') || 'basico';
  }
  return 'basico';
}

export function clearTenantSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nodia_tenant_id');
    localStorage.removeItem('nodia_tenant_nombre');
    localStorage.removeItem('nodia_tenant_plan');
  }
}
