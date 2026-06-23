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
        const grouped: Record<string, number> = {};
        let grandTotal = 0;

        invoices.forEach(inv => {
            const type = inv.tipoComprobante || "Otros";

            let typeLabel = type;
            if (type === '1' || type === 'Factura A') typeLabel = 'Factura A';
            else if (type === '6' || type === 'Factura B') typeLabel = 'Factura B';
            else if (type === '11' || type === 'Factura C') typeLabel = 'Factura C';
            else if (type === '3' || type === 'Nota Crédito A') typeLabel = 'Nota Crédito A';
            else if (type === '8' || type === 'Nota Crédito B') typeLabel = 'Nota Crédito B';

            const monto = inv.montoGravado || 0;
            grouped[typeLabel] = (grouped[typeLabel] || 0) + monto;
            grandTotal += monto;
        });

        return Object.entries(grouped)
            .map(([name, value]) => ({
                name,
                value,
                percentage: grandTotal ? (value / grandTotal * 100) : 0
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
                            <th>Monto</th>
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
                                    <td>${item.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                                    <td>{item.percentage.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                        <tr className={styles.totalRow}>
                            <td>TOTAL</td>
                            <td>${grandTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                            <td>100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};