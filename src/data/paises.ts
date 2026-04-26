export interface PaisData {
  codigo:    string;
  nombre:    string;
  bandera:   string;
  telefono:  string;
  digitosTel: number;
  ciudades:  string[];
}

export const PAISES_SOPORTADOS: PaisData[] = [
  { codigo:'EC', nombre:'Ecuador',        bandera:'🇪🇨', telefono:'+593', digitosTel:9,  ciudades:['Quito','Guayaquil','Cuenca','Manta','Ambato','Loja','Ibarra','Esmeraldas','Santo Domingo','Otra'] },
  { codigo:'CO', nombre:'Colombia',       bandera:'🇨🇴', telefono:'+57',  digitosTel:10, ciudades:['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Otra'] },
  { codigo:'PE', nombre:'Perú',           bandera:'🇵🇪', telefono:'+51',  digitosTel:9,  ciudades:['Lima','Arequipa','Trujillo','Chiclayo','Piura','Otra'] },
  { codigo:'MX', nombre:'México',         bandera:'🇲🇽', telefono:'+52',  digitosTel:10, ciudades:['Ciudad de México','Guadalajara','Monterrey','Puebla','Tijuana','Otra'] },
  { codigo:'AR', nombre:'Argentina',      bandera:'🇦🇷', telefono:'+54',  digitosTel:10, ciudades:['Buenos Aires','Córdoba','Rosario','Mendoza','Otra'] },
  { codigo:'CL', nombre:'Chile',          bandera:'🇨🇱', telefono:'+56',  digitosTel:9,  ciudades:['Santiago','Valparaíso','Concepción','Antofagasta','Otra'] },
];

export const TODOS_LOS_PAISES: PaisData[] = [
  ...PAISES_SOPORTADOS,
  { codigo:'US', nombre:'Estados Unidos', bandera:'🇺🇸', telefono:'+1',   digitosTel:10, ciudades:[] },
  { codigo:'ES', nombre:'España',         bandera:'🇪🇸', telefono:'+34',  digitosTel:9,  ciudades:[] },
  { codigo:'VE', nombre:'Venezuela',      bandera:'🇻🇪', telefono:'+58',  digitosTel:10, ciudades:[] },
  { codigo:'BO', nombre:'Bolivia',        bandera:'🇧🇴', telefono:'+591', digitosTel:8,  ciudades:[] },
  { codigo:'PY', nombre:'Paraguay',       bandera:'🇵🇾', telefono:'+595', digitosTel:9,  ciudades:[] },
  { codigo:'UY', nombre:'Uruguay',        bandera:'🇺🇾', telefono:'+598', digitosTel:8,  ciudades:[] },
];
