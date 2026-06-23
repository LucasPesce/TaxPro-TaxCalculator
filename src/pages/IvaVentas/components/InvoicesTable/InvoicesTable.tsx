import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { type Invoice } from '../../../../types';
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge/StatusBadge';
import styles from './InvoicesTable.module.css';

interface InvoicesTableProps {
    invoices: Invoice[];
    onEdit: (invoice: Invoice) => void;
    onSort: (key: any) => void;
    sortConfig: { key: string | number | symbol; direction: 'ascending' | 'descending' };
}

const formatCurrency = (value: number) => {
    return value ? value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, onEdit, onSort, sortConfig }) => {

    const getSortIcon = (key: any) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    return (
        <Card title="Registro de Facturas de Venta">
            <div className={styles.tableWrapper}>
<table className={styles.table} style={{ textAlign: 'center' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                            <th className={styles.sortableHeader} onClick={() => onSort('fecha')}>F. Emisión <FontAwesomeIcon icon={getSortIcon('fecha')} /></th>
                            <th>Tipo Comp.</th>
                            <th>Pto Venta</th>
                            <th>Nro Desde</th>
                            <th>Nro Hasta</th>
                            <th>Cód. Autoriz.</th>
                            <th>Tipo Doc.</th>
                            <th>Nro Doc.</th>
                            <th className={styles.sortableHeader} onClick={() => onSort('denominacionReceptor')}>Receptor <FontAwesomeIcon icon={getSortIcon('denominacionReceptor')} /></th>
                            <th>T. Cambio</th>
                            <th>Moneda</th>
                            <th>Neto IVA 0%</th>
                            <th>IVA 2.5%</th>
                            <th>Neto IVA 2.5%</th>
                            <th>IVA 5%</th>
                            <th>Neto IVA 5%</th>
                            <th>IVA 10.5%</th>
                            <th>Neto IVA 10.5%</th>
                            <th>IVA 21%</th>
                            <th>Neto IVA 21%</th>
                            <th>IVA 27%</th>
                            <th>Neto IVA 27%</th>
                            <th>Neto Grav. Total</th>
                            <th>Neto No Grav.</th>
                            <th>Op. Exentas</th>
                            <th>Otros Trib.</th>
                            <th>Total IVA</th>
                            <th className={styles.sortableHeader} onClick={() => onSort('total')}>Total <FontAwesomeIcon icon={getSortIcon('total')} /></th>
                            <th className={styles.sortableHeader} onClick={() => onSort('controlIva')}>Control IVA <FontAwesomeIcon icon={getSortIcon('controlIva')} /></th>
                            <th className={styles.sortableHeader} onClick={() => onSort('correlatividad')}>Correlatividad <FontAwesomeIcon icon={getSortIcon('correlatividad')} /></th>
                        </tr>
                    </thead>
                    
                    <tbody>
                        {invoices.length > 0 ? (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td>{invoice.fecha}</td>
                                    <td>{invoice.tipoComprobante}</td>
                                    <td>{invoice.puntoVenta}</td>
                                    <td>{invoice.numeroDesde}</td>
                                    <td>{invoice.numeroHasta}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{invoice.codAutorizacion || '-'}</td>
                                    <td>{invoice.tipoDocReceptor}</td>
                                    <td>{invoice.nroDocReceptor}</td>
                                    <td style={{ fontWeight: '600' }}>{invoice.denominacionReceptor}</td>
                                    <td>{invoice.tipoCambio}</td>
                                    <td>{invoice.moneda}</td>
                                    
                                    {/* Alícuotas e Importes específicos */}
                                    <td>${formatCurrency(invoice.netoGravado0)}</td>
                                    <td>${formatCurrency(invoice.iva25)}</td>
                                    <td>${formatCurrency(invoice.netoGravado25)}</td>
                                    <td>${formatCurrency(invoice.iva5)}</td>
                                    <td>${formatCurrency(invoice.netoGravado5)}</td>
                                    <td>${formatCurrency(invoice.iva105)}</td>
                                    <td>${formatCurrency(invoice.netoGravado105)}</td>
                                    <td>${formatCurrency(invoice.iva21)}</td>
                                    <td>${formatCurrency(invoice.netoGravado21)}</td>
                                    <td>${formatCurrency(invoice.iva27)}</td>
                                    <td>${formatCurrency(invoice.netoGravado27)}</td>
                                    
                                    {/* Totales consolidadores */}
                                    <td>${formatCurrency(invoice.montoGravadoTotal)}</td>
                                    <td>${formatCurrency(invoice.netoNoGravado)}</td>
                                    <td>${formatCurrency(invoice.operacionesExentas)}</td>
                                    <td>${formatCurrency(invoice.otrosTributos)}</td>
                                    <td>${formatCurrency(invoice.totalIva)}</td>
                                    <td style={{ fontWeight: 'bold' }}>${formatCurrency(invoice.total)}</td>
                                    
                                    <td><StatusBadge status={invoice.controlIva} /></td>
                                    <td><StatusBadge status={invoice.correlatividad} /></td>
                                    <td>
                                        <Button 
                                            variant="icon" 
                                            onClick={() => onEdit(invoice)} 
                                            title={invoice.controlIva === 'Correcto' && invoice.correlatividad === 'Correcto' ? "Sin errores para editar" : `Editar factura`}
                                            disabled={invoice.controlIva === 'Correcto' && invoice.correlatividad === 'Correcto'}
                                        >
                                            <FontAwesomeIcon icon={faPencil} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={31} className={styles.emptyTableMessage}>
                                    No hay comprobantes cargados en este periodo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};