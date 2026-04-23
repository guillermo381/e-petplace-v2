import React, { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.jpg';

/* ── Fortaleza de contraseña ─────────────────────────────────── */
interface Strength { score: number; label: string; color: string }

const getStrength = (pwd: string): Strength => {
  if (pwd.length === 0) return { score: 0, label: '', color: '#333' };
  let score = 0;
  if (pwd.length >= 8)                       score++;
  if (pwd.length >= 12)                      score++;
  if (/[A-Z]/.test(pwd))                    score++;
  if (/[0-9]/.test(pwd))                    score++;
  if (/[^A-Za-z0-9]/.test(pwd))             score++;
  if (score <= 1) return { score,  label: 'Débil',   color: '#FF2D9B' };
  if (score <= 3) return { score,  label: 'Media',   color: '#FFE600' };
  return            { score,  label: 'Fuerte',  color: '#00F5A0' };
};

/* ════════════════════════════════════════════════════════════════
   RESET PASSWORD
════════════════════════════════════════════════════════════════ */
const ResetPassword: React.FC = () => {
  const history = useHistory();
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [ready,     setReady]     = useState(false);

  const strength = getStrength(password);

  // Supabase pone el tipo de evento PASSWORD_RECOVERY cuando llega desde el link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Si ya hay sesión activa con token de recovery en la URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (strength.score <= 1)  { setError('La contraseña es demasiado débil'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => history.replace('/home'), 2000);
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <div style={{
          background: '#000', minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 48px',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <img src={logoImg} alt="e-PetPlace"
              style={{ width: 160, display: 'block', margin: '0 auto' }} />
          </div>

          <div style={{ width: '100%', maxWidth: 360 }}>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 6px', textAlign: 'center' }}>
              Nueva contraseña
            </h1>
            <p style={{ color: '#555', fontSize: 13, textAlign: 'center', margin: '0 0 28px' }}>
              Elige una contraseña segura para tu cuenta
            </p>

            {!ready && !success && (
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,230,0,0.08)', border: '1px solid rgba(255,230,0,0.25)',
                color: '#FFE600', fontSize: 13, textAlign: 'center', marginBottom: 20,
              }}>
                ⚠️ Abre este link desde el email de recuperación
              </div>
            )}

            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg,#00F5A0,#00E5FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, boxShadow: '0 0 40px rgba(0,245,160,0.4)',
                }}>✓</div>
                <p style={{ color: '#00F5A0', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>
                  ¡Contraseña actualizada!
                </p>
                <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
                  Redirigiendo al inicio…
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Nueva contraseña */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#444' }}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#111', border: '1px solid #2a2a2a', borderRadius: 12,
                        padding: '14px 44px 14px 16px', color: '#fff', fontSize: 15, outline: 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.15)'; }}
                      onBlur={e  => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555' }}>
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Barra de fortaleza */}
                  {password.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i <= strength.score ? strength.color : '#222',
                            transition: 'background 0.2s',
                          }} />
                        ))}
                      </div>
                      <p style={{ color: strength.color, fontSize: 11, fontWeight: 600, margin: 0 }}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#444' }}>Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repite la contraseña"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#111',
                        border: `1px solid ${confirm && confirm !== password ? 'rgba(255,45,155,0.5)' : '#2a2a2a'}`,
                        borderRadius: 12,
                        padding: '14px 44px 14px 16px', color: '#fff', fontSize: 15, outline: 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,229,255,0.15)'; }}
                      onBlur={e  => { e.currentTarget.style.borderColor = (confirm && confirm !== password) ? 'rgba(255,45,155,0.5)' : '#2a2a2a'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowConf(s => !s)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#555' }}>
                      {showConf ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p style={{ color: '#FF7EB3', fontSize: 11, margin: 0 }}>Las contraseñas no coinciden</p>
                  )}
                  {confirm && confirm === password && password.length >= 8 && (
                    <p style={{ color: '#00F5A0', fontSize: 11, margin: 0 }}>✓ Coinciden</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(255,45,155,0.08)', border: '1px solid rgba(255,45,155,0.3)',
                    color: '#FF7EB3', fontSize: 13,
                  }}>{error}</div>
                )}

                <button
                  onClick={handleUpdate}
                  disabled={loading || !ready}
                  className="btn-brand"
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 14,
                    fontSize: 16, marginTop: 4,
                    opacity: (!ready || loading) ? 0.5 : 1,
                    cursor: (!ready || loading) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 30px rgba(0,229,255,0.2)',
                  }}
                >
                  {loading ? 'Actualizando…' : 'Actualizar contraseña'}
                </button>
              </div>
            )}
          </div>

          {/* Dots */}
          <div style={{ marginTop: 40, display: 'flex' }}>
            {['#FF2D9B','#00E5FF','#FFE600'].map((c, i) => (
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

export default ResetPassword;
