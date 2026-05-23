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

export interface PurchaseInvoice {
  id: number;
  cuitEmpresa: string;
  nombreEmpresa: string;
  
  proveedor: string;
  cuitProveedor: string;
  condicionIva: string;
  doc: string; // Tipo de documento (Factura A, etc.)
  nro: string; // Número de factura
  
  fechaEmision: string;
  fechaImputacion: string;
  
  provincia: string;
  jurisdiccion: string;
  clasificacion: string; // 'Mercadería', 'Servicios', etc.
  
  // Importes
  montoGravado: number;
  exento: number;
  percIva: number;
  percIIBB: number;
  percMun: number;
  ganancias: number;
  iva27: number;
  iva21: number;
  iva105: number;
  otrasRetenciones: number;
  total: number;

  // Estado (Calculado en frontend)
  controlIva: 'Correcto' | 'Error';
}

export interface Usuario {
  id: number;
  documento: string;
  nombre: string;
  apellido: string;
  username: string;
  rol: 'Asistente Contable' | 'Supervisor' | 'Gerente' | 'Administrador' | 'Sin Permisos' | string;
  password?: string; // Opcional porque el backend la enmascara
  activo: boolean;
  fechaEliminacion?: string | null;
}

export interface Cliente {
  id: number;
  razonSocial: string;
  cuitEmpresa: string;
  cuitRepresentante: string;
  claveFiscal: string;
  domicilio: string;
  numero: string;
  telefono: string;
  email: string;
  jurisdiccion: string;
  condicionIva: string;
  idActividad: string;
  activo: boolean;
  fechaEliminacion?: string | null;
}

export interface Proveedor {
  id: number;
  razonSocial: string;
  cuitProveedor: string;
  domicilio: string;
  numero: string;
  telefono: string;
  email: string;
  jurisdiccion: string;
  condicionIva: string;
  idActividad: string;
  idTipoCompra: string;
  activo: boolean;
  fechaEliminacion?: string | null;
}