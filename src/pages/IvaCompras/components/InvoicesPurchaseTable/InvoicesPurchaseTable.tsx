import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faPencil } from '@fortawesome/free-solid-svg-icons'; import { type PurchaseInvoice } from '../../../../../src/types'; // Ajusta la ruta si es necesario
import { Card } from '../../../../../src/components/ui/Card/Card';
import { StatusBadge } from '../../../../../src/components/ui/StatusBadge/StatusBadge';
import { Button } from '../../../../../src/components/ui/Button/Button';

import styles from './InvoicesPurchaseTable.module.css';

interface InvoicesPurchaseTableProps {
    invoices: PurchaseInvoice[];
    onSort: (key: any) => void;
    onUpdate: (invoice: PurchaseInvoice) => void;
    onEdit: (invoice: PurchaseInvoice) => void;
    sortConfig: { key: string | number | symbol; direction: 'ascending' | 'descending' };
}

const formatMoney = (val: number) =>
    val ? `$ ${val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-';


export const InvoicesPurchaseTable: React.FC<InvoicesPurchaseTableProps> = ({ invoices, onSort, onUpdate, onEdit, sortConfig }) => {
    // Función para mostrar el ícono correcto
    const getSortIcon = (columnKey: any) => {
        if (sortConfig.key !== columnKey) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };


    return (
        <Card title="Registro de Compras">
            <div className={styles.tableWrapper}>
<table className={styles.table} style={{ textAlign: 'center', minWidth: '1800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Proveedor</th>
                            <th>Tipo Doc.</th>
                            <th>CUIT Emisor</th>
                            <th onClick={() => onSort('fechaImputacion')} style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                F. Imputación <FontAwesomeIcon icon={getSortIcon('fechaImputacion')} />
                            </th>                            
                            <th>F. Emisión</th>
                            <th>Tipo Comp.</th>
                            <th>Pto Venta</th>
                            <th>Nro Desde</th>
                            <th>Nro Hasta</th>
                            <th>Cód. Autoriz.</th>
                            <th>T. Cambio</th>
                            <th>Moneda</th>
                            <th>Imp. Neto Gravado</th>
                            <th>Imp. Neto No Grav.</th>
                            <th>Imp. Op. Exentas</th>
                            <th>Otros Tributos</th>
                            <th>IVA (Total)</th>
                            <th onClick={() => onSort('total')} style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                Total <FontAwesomeIcon icon={getSortIcon('total')} />
                            </th>
                            <th onClick={() => onSort('controlIva')} style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}>
                                Control IVA <FontAwesomeIcon icon={getSortIcon('controlIva')} />
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? (
                            invoices.map((inv) => (
                                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '10px 12px', textAlign: 'left' }}><strong>{inv.proveedor}</strong></td>
                                    <td>{inv.tipoDocEmisor}</td>
                                    <td>{inv.cuitProveedor}</td>
                                    <td>{inv.fechaImputacion}</td>
                                    <td>{inv.fechaEmision}</td>
                                    <td>{inv.tipoComprobante}</td>
                                    <td>{inv.puntoVenta}</td>
                                    <td>{inv.numeroDesde}</td>
                                    <td>{inv.numeroHasta}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{inv.codAutorizacion || '-'}</td>
                                    <td>{inv.tipoCambio}</td>
                                    <td>{inv.moneda}</td>

                                    {/* Importes oficiales */}
                                    <td>{formatMoney(inv.montoGravado)}</td>
                                    <td>{formatMoney(inv.exento - (inv.exento && inv.netoNoGravado ? inv.netoNoGravado : 0))}</td> {/* Exento puro */}
                                    <td>{formatMoney(inv.netoNoGravado)}</td>
                                    <td>{formatMoney(inv.otrosTributos)}</td>
                                    <td>{formatMoney(inv.iva)}</td>

                                    <td className={styles.totalCell}>{formatMoney(inv.total)}</td>
                                    <td><StatusBadge status={inv.controlIva} /></td>

                                    <td>
                                        <Button
                                            variant="icon"
                                            onClick={() => onEdit(inv)}
                                            title={inv.controlIva === 'Validado' ? "Sin errores para editar" : "Editar comprobante completo"}
                                            disabled={inv.controlIva === 'Validado'}
                                        >
                                            <FontAwesomeIcon icon={faPencil} />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={21} className={styles.emptyMessage}>
                                    No hay comprobantes de compra cargados en este periodo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};