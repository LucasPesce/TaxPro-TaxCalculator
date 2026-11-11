import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { type PurchaseInvoice } from '../../../../../src/types';
import styles from './CostTypeChart.module.css';

interface CostTypeChartProps {
    invoices: PurchaseInvoice[];
}

const COLORS = ['#2196F3', '#ff9800', '#d7005d', '#830499', '#eb7600', '#929593'];

export const CostTypeChart: React.FC<CostTypeChartProps> = ({ invoices }) => {

    const data = useMemo(() => {
        // Ahora guardamos un objeto con los tres valores
        const grouped: Record<string, { neto: number; iva: number; total: number }> = {};
        let grandTotal = 0;

        invoices.forEach(inv => {
            const type = inv.tipoComprobante || "Otros";

            let typeLabel = type;
            if (type === '1' || type === 'Factura A' || type === '001') typeLabel = 'Factura A';
            else if (type === '6' || type === 'Factura B' || type === '006') typeLabel = 'Factura B';
            else if (type === '11' || type === 'Factura C' || type === '011') typeLabel = 'Factura C';
            else if (type === '3' || type === 'Nota Crédito A' || type === '003') typeLabel = 'Nota Crédito A';
            else if (type === '8' || type === 'Nota Crédito B' || type === '008') typeLabel = 'Nota Crédito B';

            const neto = inv.montoGravado || 0;
            const iva = inv.iva || 0;
            const total = inv.total || 0;

            if (!grouped[typeLabel]) {
                grouped[typeLabel] = { neto: 0, iva: 0, total: 0 };
            }

            grouped[typeLabel].neto += neto;
            grouped[typeLabel].iva += iva;
            grouped[typeLabel].total += total;

            // El gran total ahora es la suma de los Totales
            grandTotal += total;
        });

        return Object.entries(grouped)
            .map(([name, values]) => ({
                name,
                neto: values.neto,
                iva: values.iva,
                value: values.total, // Recharts usa 'value' para dibujar la porción de la torta
                percentage: grandTotal ? (values.total / grandTotal * 100) : 0
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);

    }, [invoices]);

    const grandTotal = data.reduce((acc, item) => acc + item.value, 0);

    if (grandTotal === 0) return <div className={styles.emptyState}>Sin datos de comprobantes</div>;

    return (
        <div className={styles.container}>
            <div className={styles.chartSide}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => `$${val.toLocaleString('es-AR')}`} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.legendSide}>
                <table className={styles.legendTable}>
                    <thead>
                        <tr>
                            <th>Comprobante</th>
                            <th>Neto</th>
                            <th>IVA</th>
                            <th>Total</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            const itemColor = COLORS[index % COLORS.length];
                            return (
                                <tr key={item.name}>
                                    <td className={styles.legendName} style={{ color: itemColor, fontWeight: 'bold' }}>
                                        {item.name}
                                    </td>
                                    <td>${item.neto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                                    <td>${item.iva.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                                    <td>${item.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                                    <td>{item.percentage.toFixed(2)}%</td>
                                </tr>
                            );
                        })}
                        <tr className={styles.totalRow}>
                            <td>TOTAL</td>
                            <td>${data.reduce((acc, curr) => acc + curr.neto, 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                            <td>${data.reduce((acc, curr) => acc + curr.iva, 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                            <td>${grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                            <td>100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};