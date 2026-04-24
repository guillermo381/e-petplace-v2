import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

interface Props {
  onDismiss: () => void;
}

const RegisterPrompt: React.FC<Props> = ({ onDismiss }) => {
  const history = useHistory();
  const [visible, setVisible] = useState(false);

  // Trigger slide-up after first paint
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleRegister = () => {
    onDismiss();
    history.push('/');
  };

  return (
    <>
      {/* Backdrop semi-transparente — no bloquea interacción */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.45)',
          pointerEvents: 'auto',
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 901,
          background: '#111',
          borderTop: '2px solid transparent',
          backgroundClip: 'padding-box',
          borderRadius: '20px 20px 0 0',
          padding: '20px 24px 44px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          // Gradient top border via box-shadow trick
          outline: '1px solid transparent',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Línea gradiente superior */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '20px 20px 0 0',
          background: 'linear-gradient(90deg, #FF2D9B, #00E5FF)',
        }} />

        {/* Handle + X */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#333' }} />
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#555', fontSize: 20, lineHeight: 1, padding: '0 4px',
            }}
          >×</button>
        </div>

        {/* Ícono */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, marginBottom: 16,
          background: 'linear-gradient(135deg, #FF2D9B22, #00E5FF22)',
          border: '1px solid rgba(0,229,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>🐾</div>

        {/* Texto */}
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.2 }}>
          ¡Guarda tu carrito y historial de compras!
        </p>
        <p style={{ color: '#666', fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
          Crea tu cuenta gratis en 30 segundos y accede a tus pedidos, mascotas y recomendaciones personalizadas.
        </p>

        {/* Botones */}
        <button
          onClick={handleRegister}
          className="btn-brand"
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14,
            fontSize: 15, marginBottom: 10,
            boxShadow: '0 0 24px rgba(0,229,255,0.2)',
          }}
        >
          Crear cuenta gratis
        </button>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 14,
            background: 'transparent', border: '1px solid #2a2a2a',
            color: '#666', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Ahora no
        </button>
      </div>
    </>
  );
};

export default RegisterPrompt;
