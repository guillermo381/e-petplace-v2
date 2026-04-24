import React from 'react';
import { SERVICIOS, Servicio } from '../data/servicios';

// Nutrición solo aparece en Home (acceso directo a la tienda)
const NUTRICION: Servicio = {
  id:'nutricion', nombre:'Nutrición', subtitulo:'Alimentos y suplementos',
  icono:'🛒', color:'#0d1f12', textColor:'#00F5A0', ruta:'/tienda', disponible:true,
};

const HOME_SERVICES: Servicio[] = [NUTRICION, ...SERVICIOS];

interface Props {
  onServiceClick: (ruta: string, disponible: boolean) => void;
}

const ServicesGrid: React.FC<Props> = ({ onServiceClick }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
    {HOME_SERVICES.map(s => (
      <button
        key={s.id}
        onClick={() => onServiceClick(s.ruta, s.disponible)}
        style={{
          background: s.color,
          border: `1px solid ${s.textColor}22`,
          borderRadius: 12, padding: '14px 14px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          gap: 6, cursor: 'pointer', position: 'relative', textAlign: 'left',
        }}
      >
        {!s.disponible && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            background: `${s.textColor}18`, color: s.textColor,
            border: `1px solid ${s.textColor}33`,
          }}>Pronto</span>
        )}
        <span style={{ fontSize: 22, lineHeight: 1 }}>{s.icono}</span>
        <div>
          <p style={{ color: s.textColor, fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            {s.nombre}
          </p>
          <p style={{ color: `${s.textColor}88`, fontSize: 10, margin: '3px 0 0', lineHeight: 1.3 }}>
            {s.subtitulo}
          </p>
        </div>
      </button>
    ))}
  </div>
);

export default ServicesGrid;
