import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HIDDEN_ON = ['/carrito', '/checkout', '/login', '/welcome', '/reset-password'];

const FloatingCart: React.FC = () => {
  const history       = useHistory();
  const location      = useLocation();
  const { totalItems } = useCart();
  const [bounce,  setBounce]  = useState(false);
  const prevRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevRef.current) {
      setBounce(true);
      setTimeout(() => setBounce(false), 550);
    }
    prevRef.current = totalItems;
  }, [totalItems]);

  const hidden = totalItems === 0 ||
    HIDDEN_ON.some(p => location.pathname.startsWith(p));

  if (hidden) return null;

  return (
    <>
      <style>{`
        @keyframes fc-bounce {
          0%,100% { transform: scale(1); }
          25%      { transform: scale(1.22); }
          55%      { transform: scale(0.93); }
          75%      { transform: scale(1.1);  }
        }
        .fc-bounce { animation: fc-bounce 0.55s ease; }
      `}</style>

      <button
        onClick={() => history.push('/carrito')}
        className={bounce ? 'fc-bounce' : ''}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF2D9B, #00E5FF)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,229,255,0.35), 0 2px 8px rgba(0,0,0,0.4)',
          zIndex: 9999,
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 6px 28px rgba(0,229,255,0.55), 0 2px 10px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 4px 20px rgba(0,229,255,0.35), 0 2px 8px rgba(0,0,0,0.4)';
        }}
      >
        {/* Ícono carrito */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9"  cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>

        {/* Badge cantidad */}
        <div style={{
          position: 'absolute',
          top: -3,
          right: -3,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          background: '#FF2D9B',
          border: '2px solid #000',
          color: '#fff',
          fontSize: 10,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          lineHeight: 1,
        }}>
          {totalItems > 9 ? '9+' : totalItems}
        </div>
      </button>
    </>
  );
};

export default FloatingCart;
