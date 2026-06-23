export interface Invoice {
  id: number;
  cuitEmpresa: string;
  nombreEmpresa: string;
  
  // Datos AFIP
  fecha: string;
  tipoComprobante: string;
  puntoVenta: string;
  numeroDesde: string;
  numeroHasta: string;
  numeroFactura: string; 
  codAutorizacion: string;
  tipoDocReceptor: string;
  nroDocReceptor: string;
  denominacionReceptor: string;
  tipoCambio: number;
  moneda: string;
  
  // Importes
  netoGravado0: number;
  iva25: number;
  netoGravado25: number;
  iva5: number;
  netoGravado5: number;
  iva105: number;
  netoGravado105: number;
  iva21: number;
  netoGravado21: number;
  iva27: number;
  netoGravado27: number;
  montoGravadoTotal: number;
  netoNoGravado: number;
  operacionesExentas: number;
  otrosTributos: number;
  totalIva: number;
  total: number;

  // Estados locales del Frontend (no van a la BD)
  controlIva: 'Correcto' | 'Error';
  correlatividad: 'Correcto' | 'Error';
}


export interface PurchaseInvoice {
  id: number;
  cuitEmpresa: string;
  nombreEmpresa: string;
  fechaImputacion: string;
  provincia: string;
  jurisdiccion: string;

  // Datos AFIP
  fechaEmision: string;
  tipoComprobante: string;
  puntoVenta: string;
  numeroDesde: string;
  numeroHasta: string;
  numeroFactura: string;
  codAutorizacion: string;
  tipoDocEmisor: string;
  cuitProveedor: string;
  proveedor: string;
  tipoCambio: number;
  moneda: string;

  // Importes
  montoGravado: number;
  netoNoGravado: number;
  exento: number;
  otrosTributos: number;
  iva: number;
  total: number;

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
  pyme: boolean;
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