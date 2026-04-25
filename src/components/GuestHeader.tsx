import React from 'react';
import { useHistory } from 'react-router-dom';
import { useGuest } from '../context/GuestContext';
import logoImg from '../assets/logo.png';

const GuestHeader: React.FC = () => {
  const history = useHistory();
  const { exitGuest } = useGuest();

  const handleLogin = () => {
    exitGuest();
    history.push('/login');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      background: '#0a0a0a',
      borderBottom: '1px solid #1a1a1a',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      boxSizing: 'border-box',
    }}>
      <div style={{
        height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <img src={logoImg} alt="e-PetPlace" style={{ height: 30, width: 'auto' }} />

        <button
          onClick={handleLogin}
          className="btn-brand"
          style={{
            padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 700, height: 36,
          }}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
};

export default GuestHeader;
