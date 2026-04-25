import React from 'react';
import { useHistory } from 'react-router-dom';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
}

const ConsentCheckbox: React.FC<Props> = ({ checked, onChange }) => {
  const history = useHistory();

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {/* Checkbox nativo con estilo custom superpuesto */}
      <div style={{ flexShrink: 0, position: 'relative', width: 20, height: 20, marginTop: 1 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0, zIndex: 1,
          }}
        />
        {/* Capa visual sobre el input */}
        <div style={{
          width: 20, height: 20, borderRadius: 6, pointerEvents: 'none',
          border: checked ? 'none' : '2px solid var(--border-color)',
          background: checked ? 'linear-gradient(135deg,#FF2D9B,#00E5FF)' : 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
          boxShadow: checked ? '0 0 10px rgba(0,229,255,0.3)' : 'none',
        }}>
          {checked && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4.5L4 7.5L10 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Texto con links independientes */}
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
        He leído y acepto los{' '}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); history.push('/terminos'); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: '#00E5FF', fontSize: 12, padding: 0, fontWeight: 600 }}
        >
          Términos de Uso
        </button>
        {' '}y la{' '}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); history.push('/privacidad'); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer',
            color: '#00E5FF', fontSize: 12, padding: 0, fontWeight: 600 }}
        >
          Política de Privacidad
        </button>
        {' '}de e-PetPlace.{' '}
        <span style={{ color: '#FF2D9B', fontWeight: 700 }}>*</span>
      </p>
    </div>
  );
};

export default ConsentCheckbox;
