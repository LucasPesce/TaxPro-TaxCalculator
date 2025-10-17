// ARCHIVO DE PRUEBA
export interface Invoice {
  id: number;
  cliente: string;
  condIva: 'Consumidor Final' | 'Responsable Inscripto' | 'Monotributista'; // Tipos más estrictos
  doc: string;          // Este es el TIPO de comprobante (Factura A, B, etc.)
  docNumero: number;    // Este es el campo "DOCUMENTO" que faltaba
  fecha: string;
  nro: string;          // Este es el NÚMERO de factura completo
  montoGravado: number;
  iva21: number;
  percIIBB: number;
  percMun: number;
  total: number;
  provincia: string;
  controlIva: 'Correcto' | 'Error'; // Cambiado a 'Error' con mayúscula inicial
  correlatividad: 'Correcto' | 'Error';
  tipoResponsable: string;
}

export const mockInvoices: Invoice[] = [
  { id: 1, cliente: 'CONSUMIDOR FINAL', condIva: 'Consumidor Final', doc: 'Factura B', docNumero: 0, fecha: '01/02/2025', nro: '0005-00043537', montoGravado: 9078.91, iva21: 1906.9, percIIBB: 0, percMun: 0, total: 11000.00, provincia: 'Córdoba', controlIva: 'Correcto', correlatividad: 'Correcto', tipoResponsable: 'Responsable Inscripto' },
  { id: 2, cliente: 'CONSUMIDOR FINAL', condIva: 'Consumidor Final', doc: 'Factura B', docNumero: 0, fecha: '01/02/2025', nro: '0005-00043538', montoGravado: 11930.26, iva21: 2505.26, percIIBB: 0, percMun: 0, total: 14500.00, provincia: 'Córdoba', controlIva: 'Error', correlatividad: 'Correcto', tipoResponsable: 'Responsable Inscripto' },
  { id: 3, cliente: 'Tech Solutions SRL', condIva: 'Responsable Inscripto', doc: 'Factura A', docNumero: 30715489654, fecha: '02/02/2025', nro: '0001-00104852', montoGravado: 150000.00, iva21: 31500.00, percIIBB: 4500.00, percMun: 1500, total: 187500.00, provincia: 'Buenos Aires', controlIva: 'Correcto', correlatividad: 'Error', tipoResponsable: 'Responsable Inscripto' },
  { id: 4, cliente: 'Diseño Gráfico Monotributo', condIva: 'Monotributista', doc: 'Factura C', docNumero: 27351234568, fecha: '03/02/2025', nro: '0003-00001122', montoGravado: 75000.00, iva21: 0, percIIBB: 0, percMun: 0, total: 75000.00, provincia: 'Santa Fe', controlIva: 'Correcto', correlatividad: 'Correcto', tipoResponsable: 'Monotributista' },
  { id: 5, cliente: 'CONSUMIDOR FINAL', condIva: 'Consumidor Final', doc: 'Factura B', docNumero: 0, fecha: '04/02/2025', nro: '0005-00043539', montoGravado: 245454.55, iva21: 51545.45, percIIBB: 0, percMun: 0, total: 297000.00, provincia: 'Córdoba', controlIva: 'Correcto', correlatividad: 'Correcto', tipoResponsable: 'Responsable Inscripto' },
];