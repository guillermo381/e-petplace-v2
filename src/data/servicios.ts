export interface Servicio {
  id: string;
  nombre: string;
  subtitulo: string;
  icono: string;
  color: string;
  textColor: string;
  ruta: string;
  disponible: boolean;
}

export const SERVICIOS: Servicio[] = [
  { id:'vet',       nombre:'Veterinario', subtitulo:'Citas y consultas',       icono:'🏥', color:'#0d1a2b', textColor:'#00E5FF', ruta:'/vet',       disponible:true  },
  { id:'adopcion',  nombre:'Adopción',    subtitulo:'12 mascotas esperan',      icono:'🐾', color:'#1f0d14', textColor:'#FF2D9B', ruta:'/adopcion',  disponible:true  },
  { id:'guarderia', nombre:'Guardería',   subtitulo:'Cuidado a domicilio',      icono:'🏠', color:'#1f1a08', textColor:'#FFE600', ruta:'/guarderia', disponible:false },
  { id:'grooming',  nombre:'Grooming',    subtitulo:'Estética y spa',           icono:'✂️', color:'#150d1f', textColor:'#A78BFA', ruta:'/grooming',  disponible:false },
  { id:'paseos',    nombre:'Paseos',      subtitulo:'Paseadores verificados',   icono:'🚶', color:'#1a0f08', textColor:'#FF6B35', ruta:'/paseos',    disponible:false },
  { id:'seguros',   nombre:'Seguros',     subtitulo:'Protege a tu mascota',     icono:'🛡️', color:'#0a1a2a', textColor:'#00E5FF', ruta:'/seguros',   disponible:false },
  { id:'wearables', nombre:'Wearables',   subtitulo:'Salud en tiempo real',     icono:'⌚', color:'#1a0a1a', textColor:'#A78BFA', ruta:'/wearables', disponible:false },
];
