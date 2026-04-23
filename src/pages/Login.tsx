/*
CONFIGURACIÓN REQUERIDA EN SUPABASE DASHBOARD:
1. Ve a Authentication → Providers → Google
2. Habilita Google provider
3. Necesitas crear credenciales en Google Cloud Console:
   - Ve a console.cloud.google.com
   - Crea proyecto o usa existente
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Authorized redirect URIs: https://zyltipqscdsdsxnjclhp.supabase.co/auth/v1/callback
   - Copia Client ID y Client Secret a Supabase
4. En Supabase → Authentication → URL Configuration:
   - Site URL: https://e-petplace-v2.vercel.app
   - Redirect URLs: https://e-petplace-v2.vercel.app/**, http://localhost:5173/**
*/

import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.jpg';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECS = 30;

/* ── Google SVG icon ─────────────────────────────────────────── */
const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════════
   VISTA RECUPERAR CONTRASEÑA
════════════════════════════════════════════════════════════════ */
const RecuperarView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Ingresa tu email'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSuccess('¡Revisa tu email! Te enviamos el link de recuperación 📧');
  };

  return (
    <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
          Recuperar contraseña
        </p>
        <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
          Te enviaremos un link a tu email
        </p>
      </div>

      <InputField label="Email" type="email" value={email}
        onChange={setEmail} placeholder="tu@email.com" />

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(255,45,155,0.08)', border: '1px solid rgba(255,45,155,0.3)',
          color: '#FF7EB3', fontSize: 13,
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.3)',
          color: '#00F5A0', fontSize: 13,
        }}>{success}</div>
      )}

      <button
        onClick={handleSend}
        disabled={loading || !!success}
        className="btn-brand"
        style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 15, marginTop: 4 }}
      >
        {loading ? 'Enviando…' : 'Enviar link'}
      </button>

      <button onClick={onBack} style={{
        width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14,
        background: 'transparent', border: '1px solid #333', color: '#888',
        cursor: 'pointer', fontWeight: 600,
      }}>
        ← Volver
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   LOGIN PRINCIPAL
════════════════════════════════════════════════════════════════ */
const Login: React.FC = () => {
  const [isLogin,      setIsLogin]      = useState(true);
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [nombre,       setNombre]       = useState('');
  const [loading,      setLoading]      = useState(false);
  const [googleLoading,setGoogleLoading]= useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showRecuperar,setShowRecuperar]= useState(false);

  // Rate limiting
  const [attempts, setAttempts] = useState(0);
  const [lockout,  setLockout]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lockout <= 0) return;
    timerRef.current = setInterval(() => {
      setLockout(s => {
        if (s <= 1) { clearInterval(timerRef.current!); setAttempts(0); setError(''); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [lockout > 0]);

  const isLocked   = lockout > 0;
  const isDisabled = loading || isLocked;

  /* ── Google OAuth ──────────────────────────────────────────── */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/home' },
    });
    if (err) { setError('Error al conectar con Google'); setGoogleLoading(false); }
    // Si no hay error, el browser redirige → no se llega aquí
  };

  /* ── Email/password ────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true); setError(''); setSuccess('');

    if (isLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLockout(LOCKOUT_SECS);
          setError(`Demasiados intentos. Espera ${LOCKOUT_SECS} segundos.`);
        } else {
          setError(`Email o contraseña incorrectos. (${next}/${MAX_ATTEMPTS} intentos)`);
        }
      }
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { nombre: nombre || email.split('@')[0] } },
      });
      if (err) {
        setError(err.message);
      } else if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, email,
          nombre: nombre || email.split('@')[0],
        });
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      }
    }
    setLoading(false);
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login); setError(''); setSuccess('');
    if (!login) { setAttempts(0); setLockout(0); }
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <IonPage>
      <IonContent fullscreen scrollY={!showRecuperar}>
        <div style={{
          background: '#000', minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 48px',
        }}>

          {/* ── Logo ────────────────────────────────────────── */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <img src={logoImg} alt="e-PetPlace logo"
              style={{ width: 180, display: 'block', margin: '0 auto' }} />
            <p style={{ color: '#444', fontSize: 12, marginTop: 6, letterSpacing: '0.06em' }}>
              Tu mundo animal, digitalizado
            </p>
          </div>

          {/* ── Vista recuperar contraseña ───────────────────── */}
          {showRecuperar ? (
            <RecuperarView onBack={() => setShowRecuperar(false)} />
          ) : (
            <>
              {/* ── Toggle ──────────────────────────────────── */}
              <div style={{
                width: '100%', maxWidth: 360, display: 'flex',
                background: '#111', border: '1px solid #222',
                borderRadius: 16, padding: 4, marginBottom: 24,
              }}>
                {([{ label:'Ingresar', val:true }, { label:'Registrarse', val:false }] as { label:string; val:boolean }[])
                  .map(({ label, val }) => {
                    const active = isLogin === val;
                    return (
                      <button key={label} onClick={() => switchMode(val)} style={{
                        flex: 1, padding: '12px 0', borderRadius: 12,
                        fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: active ? 'linear-gradient(90deg,#FF2D9B,#00E5FF)' : 'transparent',
                        color: active ? '#000' : '#555',
                        boxShadow: active ? '0 0 20px rgba(0,229,255,0.3)' : 'none',
                      }}>{label}</button>
                    );
                  })}
              </div>

              {/* ── Botón Google ────────────────────────────── */}
              <div style={{ width: '100%', maxWidth: 360, marginBottom: 20 }}>
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12,
                    background: '#ffffff', border: '1px solid #e0e0e0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    fontSize: 15, fontWeight: 600, color: '#1a1a1a',
                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                    opacity: googleLoading ? 0.7 : 1,
                    transition: 'background 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {googleLoading ? (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px solid #ccc', borderTopColor: '#1a1a1a',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  ) : <GoogleIcon />}
                  {googleLoading ? 'Conectando…' : 'Continuar con Google'}
                </button>

                {/* ── Separador ─────────────────────────────── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 0',
                }}>
                  <div style={{ flex: 1, height: 1, background: '#222' }} />
                  <span style={{ color: '#444', fontSize: 12, fontWeight: 600 }}>o</span>
                  <div style={{ flex: 1, height: 1, background: '#222' }} />
                </div>
              </div>

              {/* ── Formulario ──────────────────────────────── */}
              <form onSubmit={handleSubmit} style={{
                width: '100%', maxWidth: 360,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {!isLogin && (
                  <InputField label="Tu nombre" type="text" value={nombre}
                    onChange={setNombre} placeholder="Ej: María García" />
                )}

                <InputField label="Email" type="email" value={email}
                  onChange={setEmail} placeholder="tu@email.com" required />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <InputField label="Contraseña" type="password" value={password}
                    onChange={setPassword} placeholder="••••••••" required minLength={6} />
                  {/* ¿Olvidaste tu contraseña? */}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowRecuperar(true)}
                      style={{
                        alignSelf: 'flex-end', background: 'none', border: 'none',
                        color: '#00E5FF', fontSize: 12, cursor: 'pointer',
                        padding: '2px 0', fontWeight: 500,
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: isLocked ? 'rgba(255,45,155,0.12)' : 'rgba(255,45,155,0.08)',
                    border: '1px solid rgba(255,45,155,0.3)',
                    color: '#FF7EB3', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}>
                    <span>{error}</span>
                    {isLocked && (
                      <span style={{
                        background: '#FF2D9B', color: '#000', fontWeight: 800,
                        borderRadius: 8, padding: '2px 8px', fontSize: 13, flexShrink: 0,
                      }}>{lockout}s</span>
                    )}
                  </div>
                )}

                {/* Success */}
                {success && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)',
                    color: '#00E5FF', fontSize: 13,
                  }}>{success}</div>
                )}

                {/* Submit */}
                <button type="submit" disabled={isDisabled} className="btn-brand"
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 14,
                    fontSize: 16, marginTop: 2,
                    boxShadow: isLocked ? 'none' : '0 0 40px rgba(0,229,255,0.2)',
                    opacity: isLocked ? 0.45 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLocked ? `Bloqueado ${lockout}s` : loading ? 'Cargando…' : isLogin ? 'Entrar a PetPlace 🐾' : 'Crear cuenta'}
                </button>
              </form>
            </>
          )}

          {/* ── Dots decorativos ────────────────────────────── */}
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center' }}>
            {['#FF2D9B', '#00E5FF', '#FFE600'].map((c, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c, margin: '0 3px', boxShadow: `0 0 10px ${c}`,
              }} />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* ── Input field ─────────────────────────────────────────────── */
interface InputFieldProps {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; minLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label, type, value, onChange, placeholder, required, minLength,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: '#444',
    }}>{label}</label>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required} minLength={minLength}
      style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: 12,
        padding: '14px 16px', color: '#fff', fontSize: 15,
        width: '100%', boxSizing: 'border-box', outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => {
        e.currentTarget.style.borderColor = '#00E5FF';
        e.currentTarget.style.boxShadow   = '0 0 0 2px rgba(0,229,255,0.15)';
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = '#2a2a2a';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    />
  </div>
);

export default Login;
