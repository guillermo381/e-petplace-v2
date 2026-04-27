import React from 'react';
import { SERVICIOS, Servicio } from '../data/servicios';

const NUTRICION: Servicio = {
  id:'nutricion', nombre:'Nutrición', subtitulo:'Alimentos y suplementos',
  icono:'🛒', color:'#0d1f12', textColor:'#00F5A0', ruta:'/tienda', disponible:true,
};

const HOME_SERVICES: Servicio[] = [NUTRICION, ...SERVICIOS];

interface Props {
  onServiceClick: (ruta: string, disponible: boolean) => void;
}

const ServicesGrid: React.FC<Props> = ({ onServiceClick }) => (
  <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
    {HOME_SERVICES.map(s => (
      <button
        key={s.id}
        onClick={() => onServiceClick(s.ruta, s.disponible)}
        style={{
          flexShrink:0,
          display:'flex', flexDirection:'column', alignItems:'center',
          gap:6, cursor:'pointer', background:'none', border:'none', padding:0,
        }}
      >
        <div style={{
          width:56, height:56, borderRadius:16,
          background: s.color,
          border:`1px solid ${s.textColor}33`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24,
          opacity: s.disponible ? 1 : 0.5,
        }}>
          {s.icono}
        </div>
        <span style={{
          fontSize:10, fontWeight:600, color:'var(--text-secondary)',
          textAlign:'center', maxWidth:60, lineHeight:1.2,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>
          {s.nombre}
        </span>
        {!s.disponible && (
          <span style={{
            fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:4,
            background:`${s.textColor}18`, color:s.textColor,
            border:`1px solid ${s.textColor}33`, marginTop:-4,
          }}>Pronto</span>
        )}
      </button>
    ))}
  </div>
);

export default ServicesGrid;
