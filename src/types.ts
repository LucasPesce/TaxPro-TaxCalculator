// src/types.ts
export interface Invoice {
  id: number;
  cliente: string;
  condIva: 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributista' | string; // Agregamos string para ser flexibles con la importación
  doc: string;
  docNumero: number;
  fecha: string;
  nro: string;
  montoGravado: number;
  iva21: number;
  percIIBB: number;
  percMun: number;
  total: number;
  provincia: string;
  // Campos calculados (NO van a la BD)
  controlIva: 'Correcto' | 'Error';
  correlatividad: 'Correcto' | 'Error';
}