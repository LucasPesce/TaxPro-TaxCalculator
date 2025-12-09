import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faPencil } from '@fortawesome/free-solid-svg-icons'; import { type PurchaseInvoice } from '../../../../../src/types'; // Ajusta la ruta si es necesario
import { Card } from '../../../../../src/components/ui/Card/Card';
import { StatusBadge } from '../../../../../src/components/ui/StatusBadge/StatusBadge';
import { Button } from '../../../../../src/components/ui/Button/Button';

import styles from './InvoicesPurchaseTable.module.css';

interface InvoicesPurchaseTableProps {
    invoices: PurchaseInvoice[];
    onSort: (key: keyof PurchaseInvoice) => void;
    onUpdate: (invoice: PurchaseInvoice) => void;
    onEdit: (invoice: PurchaseInvoice) => void;
    sortConfig: { key: keyof PurchaseInvoice; direction: 'ascending' | 'descending' };

}

const formatMoney = (val: number) =>
    val ? `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-';

const CLASSIFICATION_OPTIONS = [
    "Mercadería",
    "Servicios",
    "Bienes de Uso",
    "Locación",
    "Otros Gastos"
];

export const InvoicesPurchaseTable: React.FC<InvoicesPurchaseTableProps> = ({ invoices, onSort, onUpdate, onEdit, sortConfig }) => {

    const handleClassificationChange = (invoice: PurchaseInvoice, newClass: string) => {
        // Creamos una copia actualizada y la enviamos al padre para que la guarde
        const updatedInvoice = { ...invoice, clasificacion: newClass };
        onUpdate(updatedInvoice);
    };


    // Función para mostrar el ícono correcto
    const getSortIcon = (columnKey: keyof PurchaseInvoice) => {
        if (sortConfig.key !== columnKey) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };


    return (
        <Card title="Registro de Compras">
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th>Cond. IVA</th>
                            <th>CUIT</th>
                            <th>Clasificación</th>
                            <th onClick={() => onSort('fechaImputacion')} className={styles.sortableHeader}>
                                F. Imputación <FontAwesomeIcon icon={getSortIcon('fechaImputacion')} />
                            </th>                            <th>Comp.</th>
                            <th>Número</th>
                            <th>Gravado</th>
                            <th>Exento</th>
                            <th>Perc. IVA</th>
                            <th>Perc. IIBB</th>
                            <th>Perc. Mun.</th>
                            <th>Ganancias</th>
                            <th>IVA 27%</th>
                            <th>IVA 21%</th>
                            <th>IVA 10.5%</th>
                            <th>Otras Ret.</th>
                            <th onClick={() => onSort('total')} className={styles.sortableHeader}>
                                Total <FontAwesomeIcon icon={getSortIcon('total')} />
                            </th>
                            <th onClick={() => onSort('controlIva')} className={styles.sortableHeader}>
                                Control IVA <FontAwesomeIcon icon={getSortIcon('controlIva')} />
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? (
                            invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td>{inv.proveedor}</td>
                                    <td>{inv.condicionIva}</td>
                                    <td>{inv.cuitProveedor}</td>

                                    {/* Selector de Clasificación */}
                                    <td className={styles.selectCell}>
                                        <select
                                            className={styles.classificationSelect}
                                            value={inv.clasificacion || "Mercadería"}
                                            onChange={(e) => handleClassificationChange(inv, e.target.value)}
                                            title="Clasificación del gasto">
                                            {CLASSIFICATION_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td>{inv.fechaImputacion}</td>
                                    <td>{inv.doc}</td>
                                    <td>{inv.nro}</td>

                                    {/* Importes */}
                                    <td>{formatMoney(inv.montoGravado)}</td>
                                    <td>{formatMoney(inv.exento)}</td>
                                    <td>{formatMoney(inv.percIva)}</td>
                                    <td>{formatMoney(inv.percIIBB)}</td>
                                    <td>{formatMoney(inv.percMun)}</td>
                                    <td>{formatMoney(inv.ganancias)}</td>
                                    <td>{formatMoney(inv.iva27)}</td>
                                    <td>{formatMoney(inv.iva21)}</td>
                                    <td>{formatMoney(inv.iva105)}</td>
                                    <td>{formatMoney(inv.otrasRetenciones)}</td>

                                    <td className={styles.totalCell}>{formatMoney(inv.total)}</td>
                                    <td><StatusBadge status={inv.controlIva} /></td>

                                    <td>
                                        <Button
                                            variant="icon"
                                            onClick={() => onEdit(inv)}
                                            title="Editar comprobante completo"
                                        >
                                            <FontAwesomeIcon icon={faPencil} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={20} className={styles.emptyMessage}>
                                    No hay comprobantes de compra cargados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};