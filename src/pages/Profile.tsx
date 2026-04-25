import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonToggle } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface Profile { id: string; nombre: string; email: string; avatar_url?: string }
interface Mascota  { id: string; nombre: string; especie: string }

interface Props { session: Session }

const ESPECIE_EMOJI: Record<string, string> = {
  perro:'🐶', gato:'🐱', ave:'🐦', pez:'🐠', otro:'🐾',
};
const AVATAR_COLORS = ['#7C3AED', '#FF2D9B', '#00E5FF', '#00F5A0'];

const Profile: React.FC<Props> = ({ session }) => {
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [editing,  setEditing]  = useState(false);
  const [nombre,   setNombre]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const fetch = async () => {
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (prof) {
        setProfile(prof);
        setNombre(prof.nombre ?? '');
      } else {
        const fallback = session.user.user_metadata?.nombre ?? session.user.email?.split('@')[0] ?? 'Usuario';
        setNombre(fallback);
      }
      const { data: mascs } = await supabase
        .from('mascotas').select('id, nombre, especie').eq('user_id', session.user.id).order('nombre');
      if (mascs) setMascotas(mascs as Mascota[]);
    };
    fetch();
  }, [session]);

  const saveProfile = async () => {
    setSaving(true);
    const { data } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, email: session.user.email!, nombre })
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.tsx redirige via onAuthStateChange
  };

  const displayNombre = profile?.nombre ?? nombre ?? session.user.email?.split('@')[0] ?? 'Usuario';
  const initials      = displayNombre.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const colorIdx      = (session.user.email?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  const avatarColor   = AVATAR_COLORS[colorIdx];
  const joinYear      = new Date(session.user.created_at ?? Date.now()).getFullYear();

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="pb-28" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="px-5 pt-14 pb-6 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-white">Perfil</h1>
            <button
              onClick={() => { setEditing(e => !e); if (editing) setNombre(profile?.nombre ?? ''); }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#141414', color: '#7C3AED', border: '1px solid #2a2a2a' }}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {/* ── Avatar ───────────────────────────────────────────── */}
          <div className="flex flex-col items-center mb-8 px-5">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover mb-3"
                style={{ border: `3px solid ${avatarColor}` }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white mb-3"
                style={{
                  background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`,
                  boxShadow:  `0 0 35px ${avatarColor}55`,
                }}
              >
                {initials}
              </div>
            )}

            {editing ? (
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="text-xl font-bold text-center text-white bg-transparent border-b-2 outline-none px-2 pb-1"
                style={{ borderColor: '#7C3AED', background: 'transparent', border: 'none', borderBottom: '2px solid #7C3AED' }}
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{displayNombre}</h2>
            )}
            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
          </div>

          {/* Guardar cambios */}
          {editing && (
            <div className="px-5 mb-6">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  boxShadow:  '0 0 20px rgba(124,58,237,0.35)',
                }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          )}

          {/* ── Stats ────────────────────────────────────────────── */}
          <div className="px-5 mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Mascotas', val: String(mascotas.length), color: '#7C3AED' },
              { label: 'Miembro',  val: String(joinYear),         color: '#00E5FF' },
              { label: 'Estado',   val: '✓ Activo',               color: '#00F5A0' },
            ].map(s => (
              <div key={s.label} className="py-4 rounded-2xl flex flex-col items-center gap-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <p className="font-bold text-sm text-center leading-tight" style={{ color: s.color }}>{s.val}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Mis mascotas ─────────────────────────────────────── */}
          {mascotas.length > 0 && (
            <div className="px-5 mb-6">
              <h2 className="text-white font-semibold mb-3">Mis Mascotas</h2>
              <div className="space-y-2">
                {mascotas.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  >
                    <span className="text-xl">{ESPECIE_EMOJI[m.especie] ?? '🐾'}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{m.nombre}</p>
                      <p className="text-gray-500 text-xs capitalize">{m.especie}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Info app ─────────────────────────────────────────── */}
          <div className="px-5 mb-6">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Aplicación</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              {/* Toggle tema */}
              <div
                className="w-full flex items-center gap-3 px-4 py-4"
                style={{
                  background:   'var(--bg-card)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                  {isDark ? 'Modo oscuro' : 'Modo claro'}
                </span>
                <IonToggle
                  checked={isDark}
                  onIonChange={toggleTheme}
                  style={{ '--track-background-checked': '#00E5FF', '--handle-background-checked': '#000' } as React.CSSProperties}
                />
              </div>

              {[
                { icon: '🌟', label: 'e-PetPlace',  val: 'v1.0.0' },
                { icon: '🔒', label: 'Privacidad',  val: '›' },
                { icon: '📋', label: 'Términos',    val: '›' },
                { icon: '💬', label: 'Soporte',     val: '›' },
              ].map((item, i, arr) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  style={{
                    background:   'var(--bg-card)',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.val}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Logout ───────────────────────────────────────────── */}
          <div className="px-5">
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'rgba(255,45,155,0.08)',
                color:       '#FF2D9B',
                border:      '1px solid rgba(255,45,155,0.22)',
                boxShadow:   '0 0 20px rgba(255,45,155,0.1)',
              }}
            >
              Cerrar sesión 👋
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
