import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { type PurchaseInvoice } from '../../../../../src/types';
import styles from './CostTypeChart.module.css';

interface CostTypeChartProps {
    invoices: PurchaseInvoice[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const CostTypeChart: React.FC<CostTypeChartProps> = ({ invoices }) => {

    const data = useMemo(() => {
        const grouped: Record<string, number> = {};
        let grandTotal = 0;

        // Agrupar y sumar
        invoices.forEach(inv => {
            const cat = inv.clasificacion || "Sin clasificar";
            // Usamos montoGravado como base del costo, o podrías usar 'total' según criterio contable
            const monto = inv.montoGravado;
            grouped[cat] = (grouped[cat] || 0) + monto;
            grandTotal += monto;
        });

        // Convertir a array para Recharts
        return Object.entries(grouped).map(([name, value]) => ({
            name,
            value,
            percentage: grandTotal ? (value / grandTotal * 100) : 0
        })).sort((a, b) => b.value - a.value); // Ordenar mayor a menor

    }, [invoices]);

    const grandTotal = data.reduce((acc, item) => acc + item.value, 0);

    if (grandTotal === 0) return <div className={styles.emptyState}>Sin datos de costos</div>;

    return (
        <div className={styles.container}>
            {/* Lado Izquierdo: Gráfico */}
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

            {/* Lado Derecho: Tabla Leyenda */}
            <div className={styles.legendSide}>
                <table className={styles.legendTable}>
                    <thead>
                        <tr>
                            <th>Clasificación</th>
                            <th>Monto</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            // Calculamos dinámicamente qué clase usar (color0, color1, etc.)
                            const colorClass = styles[`color${index % 5}`];

                            return (
                                <tr key={item.name}>
                                    {/* Aquí combinamos la clase base (negrita) con la clase de color */}
                                    <td className={`${styles.legendName} ${colorClass}`}>
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