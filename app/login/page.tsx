'use client';
// app/login/page.tsx
// Página de Login multi-tenant — autentica con Supabase y carga el tenant del usuario

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Magic Link Auto-Authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const magicToken = params.get('magic');
    if (!magicToken) return;

    async function authenticateMagicToken(token: string) {
      setLoading(true);
      setError('');
      try {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('tenant_id, nombre, activo, plan')
          .eq('tenant_id', token)
          .single();

        if (tenantError || !tenant) {
          setError('Link de acceso inválido o expirado ❌');
          setLoading(false);
          return;
        }
        if (!tenant.activo) {
          setError('Tu cuenta está pausada. Contacta a NODIA para reactivarla ⚠️');
          setLoading(false);
          return;
        }
        // Guardar credenciales de sesión del cliente
        localStorage.setItem('nodia_tenant_id', tenant.tenant_id);
        localStorage.setItem('nodia_tenant_nombre', tenant.nombre);
        localStorage.setItem('nodia_tenant_plan', tenant.plan || 'basico');
        
        // Redirigir directamente a la configuración para el onboarding
        router.push('/config');
      } catch (err) {
        setError('Error al conectar con la base de datos 🔌');
        setLoading(false);
      }
    }

    authenticateMagicToken(magicToken);
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw new Error('Correo o contraseña incorrectos');

      const userId = authData.user.id;

      // 2. Buscar el tenant vinculado a este usuario
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('tenant_id, nombre, activo, plan')
        .eq('user_id', userId)
        .single();

      if (tenantError || !tenant) throw new Error('No se encontró una cuenta asociada a este usuario');
      if (!tenant.activo) throw new Error('Tu cuenta está pausada. Contacta a NODIA para reactivarla.');

      // 3. Guardar tenant_id en localStorage para usarlo en el panel
      localStorage.setItem('nodia_tenant_id', tenant.tenant_id);
      localStorage.setItem('nodia_tenant_nombre', tenant.nombre);
      localStorage.setItem('nodia_tenant_plan', tenant.plan || 'basico');

      // 4. Redirigir al panel
      router.push('/inbox');

    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.08) 0%, #0a0d14 60%)'
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenido a NODIA</h1>
          <p className="text-sm text-white/40 mt-1">Ingresa a tu panel de gestión</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-white font-semibold py-3 rounded-xl transition-all text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </>
              ) : 'Ingresar al Panel →'}
            </button>
          </form>

          <p className="text-center text-xs text-white/20 mt-6">
            ¿No tienes cuenta?{' '}
            <a href="/landing" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Regístrate aquí
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          © 2024 NODIA · Plataforma WhatsApp Business AI
        </p>
      </div>
    </div>
  );
}
