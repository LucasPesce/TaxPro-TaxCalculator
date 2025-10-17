import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { type Invoice } from '../../mock-data'; // Importamos el TIPO
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge/StatusBadge';
import styles from './InvoicesTable.module.css';


interface InvoicesTableProps {
    invoices: Invoice[]; // La tabla espera recibir un array de facturas
    onEdit: (invoice: Invoice) => void;

}

const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, onEdit }) => {
    return (
        // 3. Usamos el componente <Card> como contenedor principal
        <Card title="Registro de Facturas">
            <div className={styles.tableWrapper}>
                {/* 4. Aplicamos las clases del módulo a la tabla y sus elementos */}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Cond. IVA</th>
                            <th>Documento</th>
                            <th>Fecha</th>
                            <th>Comprobante</th>
                            <th>Número</th>
                            <th>Monto Gravado</th>
                            <th>IVA 21%</th>
                            <th>Perc. IIBB</th>
                            <th>Perc. Mun.</th>
                            <th>Total</th>
                            <th>Provincia</th>
                            <th>Control IVA</th>
                            <th>Correlatividad</th>
                            <th></th> {/* Columna para acciones */}
                        </tr>
                    </thead>
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