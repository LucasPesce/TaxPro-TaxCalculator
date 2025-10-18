//================ IMPORTACIONES ====================
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { type Invoice } from '../../mock-data';
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge/StatusBadge';
import styles from './InvoicesTable.module.css';

//================ DEFINICIÓN DE TIPOS Y PROPS ====================
type SortKey = keyof Invoice;
type SortDirection = 'ascending' | 'descending';

interface InvoicesTableProps {
    invoices: Invoice[];
    onEdit: (invoice: Invoice) => void;
    onSort: (key: SortKey) => void;
    sortConfig: { key: SortKey; direction: SortDirection };
}

//================ FUNCIÓN UTILITARIA: FORMATEO DE MONEDA ====================
const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

//================ COMPONENTE PRINCIPAL: InvoicesTable ====================
export const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, onEdit, onSort, sortConfig }) => {

    //================ LÓGICA INTERNA: GESTIÓN DE ICONOS DE ORDENAMIENTO ====================
    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) {
            return faSort;
        }
        if (sortConfig.direction === 'ascending') {
            return faSortUp;
        }
        return faSortDown;
    };

    //================ RENDERIZADO DEL COMPONENTE ====================
    return (
        <Card title="Registro de Facturas">
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    {/* //================ ENCABEZADO DE LA TABLA ==================== */}
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Cond. IVA</th>
                            <th>Documento</th>
                            <th>Fecha</th>
                            <th>Comprobante</th>
                            <th className={styles.sortableHeader} onClick={() => onSort('nro')}>
                                Número
                                <FontAwesomeIcon icon={getSortIcon('nro')} className={styles.sortIcon} />
                            </th>
                            <th>Monto Gravado</th>
                            <th>IVA 21%</th>
                            <th>Perc. IIBB</th>
                            <th>Perc. Mun.</th>
                            <th>Total</th>
                            <th>Provincia</th>
                            <th className={styles.sortableHeader} onClick={() => onSort('controlIva')}>
                                Control IVA
                                <FontAwesomeIcon icon={getSortIcon('controlIva')} className={styles.sortIcon} />
                            </th>
                            <th className={styles.sortableHeader} onClick={() => onSort('correlatividad')}>
                                Correlatividad
                                <FontAwesomeIcon icon={getSortIcon('correlatividad')} className={styles.sortIcon} />
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    {/* //================ CUERPO DE LA TABLA (MAPEO DE DATOS) ==================== */}
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td>{invoice.cliente}</td>
                                <td>{invoice.condIva}</td>
                                <td>{invoice.docNumero === 0 ? '-' : invoice.docNumero}</td>
                                <td>{invoice.fecha}</td>
                                <td>{invoice.doc}</td>
                                <td>{invoice.nro}</td>
                                <td>${formatCurrency(invoice.montoGravado)}</td>
                                <td>${formatCurrency(invoice.iva21)}</td>
                                <td>${formatCurrency(invoice.percIIBB)}</td>
                                <td>${formatCurrency(invoice.percMun)}</td>
                                <td>${formatCurrency(invoice.total)}</td>
                                <td>{invoice.provincia}</td>
                                <td><StatusBadge status={invoice.controlIva} /></td>
                                <td><StatusBadge status={invoice.correlatividad} /></td>
                                <td>
                                    <Button variant="icon" onClick={() => onEdit(invoice)} title={`Editar factura ${invoice.nro}`}>
                                        <FontAwesomeIcon icon={faPencil} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};