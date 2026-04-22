import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.jpg';

/* ── Login ───────────────────────────────────────────────────── */
const Login: React.FC = () => {
  const [isLogin,  setIsLogin]  = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [nombre,   setNombre]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isLogin) {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError('Email o contraseña incorrectos.');
    } else {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre: nombre || email.split('@')[0] } },
      });
      if (err) {
        setError(err.message);
      } else if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          nombre: nombre || email.split('@')[0],
        });
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar.');
      }
    }
    setLoading(false);
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setSuccess('');
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div
          style={{
            background: '#000000',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 48px',
          }}
        >
          {/* ── Logotipo ──────────────────────────────────────── */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <img
              src={logoImg}
              alt="e-PetPlace logo"
              style={{ width: 200, display: 'block', margin: '0 auto' }}
            />
            <p style={{ color: '#444', fontSize: 12, marginTop: 6, letterSpacing: '0.06em' }}>
              Tu mundo animal, digitalizado
            </p>
          </div>

          {/* ── Toggle Ingresar / Registrarse ─────────────────── */}
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: 16,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {([
              { label: 'Ingresar',    val: true  },
              { label: 'Registrarse', val: false },
            ] as { label: string; val: boolean }[]).map(({ label, val }) => {
              const active = isLogin === val;
              return (
                <button
                  key={label}
                  onClick={() => switchMode(val)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: active
                      ? 'linear-gradient(90deg, #FF2D9B, #00E5FF)'
                      : 'transparent',
                    color: active ? '#000' : '#555',
                    boxShadow: active
                      ? '0 0 20px rgba(0,229,255,0.3)'
                      : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ── Formulario ────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {!isLogin && (
              <InputField
                label="Tu nombre"
                type="text"
                value={nombre}
                onChange={setNombre}
                placeholder="Ej: María García"
              />
            )}

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@email.com"
              required
            />

            <InputField
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255,45,155,0.08)',
                border: '1px solid rgba(255,45,155,0.3)',
                color: '#FF7EB3',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(0,229,255,0.08)',
                border: '1px solid rgba(0,229,255,0.3)',
                color: '#00E5FF',
                fontSize: 13,
              }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-brand"
              style={{
                width: '100%',
                padding: '16px 0',
                borderRadius: 14,
                fontSize: 16,
                marginTop: 4,
                boxShadow: '0 0 40px rgba(0,229,255,0.25), 0 0 20px rgba(255,45,155,0.2)',
              }}
            >
              {loading ? 'Cargando…' : isLogin ? 'Entrar a PetPlace 🐾' : 'Crear cuenta'}
            </button>
          </form>

          {/* ── Línea decorativa de marca ──────────────────────── */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 0 }}>
            {['#FF2D9B', '#00E5FF', '#FFE600'].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: c, margin: '0 3px',
                  boxShadow: `0 0 10px ${c}`,
                }}
              />
            ))}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

/* ── Input field ─────────────────────────────────────────────── */
interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  label, type, value, onChange, placeholder, required, minLength,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#444',
    }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      style={{
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        padding: '14px 16px',
        color: '#ffffff',
        fontSize: 15,
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
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
