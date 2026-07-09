'use client';
// app/login/page.tsx — BeautySync Pro+ · Ultra Premium Login

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);

  /* ── Magic Link ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params     = new URLSearchParams(window.location.search);
    const magicToken = params.get('magic');
    if (!magicToken) return;
    async function run(token: string) {
      setLoading(true);
      try {
        const { data: tenant } = await supabase.from('tenants')
          .select('tenant_id,nombre,activo,plan').eq('tenant_id', token).single();
        if (!tenant?.activo) { setError('Link inválido o cuenta pausada'); setLoading(false); return; }
        localStorage.setItem('nodia_tenant_id',     tenant.tenant_id);
        localStorage.setItem('nodia_tenant_nombre', tenant.nombre);
        localStorage.setItem('nodia_tenant_plan',   tenant.plan || 'basico');
        router.push('/config');
      } catch { setError('Error de conexión'); setLoading(false); }
    }
    run(magicToken);
  }, [router]);

  /* ── Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) throw new Error('Correo o contraseña incorrectos');
      const { data: tenant } = await supabase.from('tenants')
        .select('tenant_id,nombre,activo,plan').eq('user_id', auth.user.id).single();
      if (!tenant) throw new Error('No hay cuenta vinculada a este usuario');
      if (!tenant.activo) throw new Error('Cuenta pausada — contacta a BeautySync Pro+');
      localStorage.setItem('nodia_tenant_id',     tenant.tenant_id);
      localStorage.setItem('nodia_tenant_nombre', tenant.nombre);
      localStorage.setItem('nodia_tenant_plan',   tenant.plan || 'basico');
      router.push('/inbox');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #04060c; }

        @keyframes float1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-30px) scale(1.05); }
          66%      { transform: translate(-20px,20px) scale(0.98); }
        }
        @keyframes float2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-50px,25px) scale(1.08); }
          66%      { transform: translate(30px,-40px) scale(0.95); }
        }
        @keyframes float3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(20px,30px); }
        }
        @keyframes gridMove {
          0%   { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(20px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }

        .orb1 { animation: float1 12s ease-in-out infinite; }
        .orb2 { animation: float2 15s ease-in-out infinite; }
        .orb3 { animation: float3 8s ease-in-out infinite; }
        .grid-move { animation: gridMove 8s linear infinite; }
        .card-enter { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        .brand-text {
          background: linear-gradient(90deg, #e2e8f0 0%, #a5b4fc 30%, #67e8f9 60%, #e2e8f0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 14px 16px;
          color: #fff;
          font-size: 14px;
          font-family: Inter, sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.2); }
        .input-field:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(99,102,241,0.06);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }

        .btn-primary {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          font-family: Inter, sans-serif;
          letter-spacing: 0.02em;
          color: white;
          background: linear-gradient(135deg, #6366f1 0%, #4338ca 40%, #0891b2 100%);
          box-shadow: 0 8px 32px rgba(99,102,241,0.35), 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          border-radius: inherit;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 40px rgba(99,102,241,0.45), 0 4px 12px rgba(0,0,0,0.4);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
        background: '#04060c',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Animated Background ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>

          {/* Grid */}
          <div className="grid-move" style={{
            position: 'absolute', inset: '-60px 0 0',
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />

          {/* Orbs */}
          <div className="orb1" style={{
            position: 'absolute', top: '-15%', left: '-10%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
            filter: 'blur(1px)',
          }} />
          <div className="orb2" style={{
            position: 'absolute', bottom: '-20%', right: '-10%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 65%)',
            filter: 'blur(1px)',
          }} />
          <div className="orb3" style={{
            position: 'absolute', top: '40%', right: '20%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          }} />

          {/* Top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(6,182,212,0.4), transparent)',
          }} />
        </div>

        {/* ── Main Card ── */}
        <div className="card-enter" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 10 }}>

          {/* Card glow border */}
          <div style={{
            position: 'absolute', inset: -1, borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(6,182,212,0.2) 50%, rgba(16,185,129,0.1) 100%)',
            filter: 'blur(0.5px)',
          }} />

          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,13,20,0.98) 100%)',
            borderRadius: 28,
            padding: '40px 36px',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

            {/* ── Logo ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                {/* Pulse rings */}
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: 28,
                  border: '1px solid rgba(99,102,241,0.2)',
                  animation: 'pulse-ring 2.5s cubic-bezier(0,0,0.2,1) infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: 26,
                  border: '1px solid rgba(99,102,241,0.15)',
                  animation: 'pulse-ring 2.5s cubic-bezier(0,0,0.2,1) infinite 0.4s',
                }} />
                {/* Logo */}
                <div style={{
                  width: 72, height: 72, borderRadius: 22, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.5)',
                }}>
                  <img src="/logo.jpg" alt="BeautySync Pro+" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Online dot */}
                <div style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#10b981',
                  border: '2.5px solid #04060c',
                  boxShadow: '0 0 10px rgba(16,185,129,0.6)',
                }} />
              </div>

              <h1 className="brand-text" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                BeautySync Pro+
              </h1>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 500, letterSpacing: '0.02em' }}>
                Panel de gestión WhatsApp Business
              </p>
            </div>

            {/* ── Divider ── */}
            <div style={{
              height: 1, marginBottom: 28,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            }} />

            {/* ── Form ── */}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Correo electrónico
                </label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.25)', padding: 4, transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                  >
                    {showPass ? (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 14px', borderRadius: 12, marginBottom: 18,
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p style={{ fontSize: 12.5, color: '#f87171', fontWeight: 500, lineHeight: 1.4 }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin-slow 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="4"/>
                      <path fill="rgba(255,255,255,0.8)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verificando acceso...
                  </span>
                ) : 'Ingresar al Panel →'}
              </button>
            </form>

            {/* ── Footer badges ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              {[
                { color: '#10b981', label: 'Encriptado' },
                { color: '#6366f1', label: 'Seguro' },
                { color: '#06b6d4', label: 'WhatsApp API' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <p style={{
          position: 'fixed', bottom: 20, left: 0, right: 0,
          textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.1)',
          fontWeight: 500, letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif',
        }}>
          © 2024 BeautySync Pro+ · Powered by NODIA AI
        </p>
      </div>
    </>
  );
}
