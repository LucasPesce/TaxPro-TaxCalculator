//================= IMPORTACIONES ==================
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './MultiSegmentChart.module.css';

//================= DEFINICIÓN DE TIPOS ==================
interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface MultiSegmentChartProps {
    data: ChartData[];
    colors: string[];
}

//================= COMPONENTE PRINCIPAL ==================
export const MultiSegmentChart: React.FC<MultiSegmentChartProps> = ({ data, colors }) => {

    const totalValue = data.reduce((acc, entry) => acc + entry.value, 0);

    if (totalValue === 0) {
        return <div className={styles.chartPlaceholder}>Sin datos suficientes</div>;
    }

    //--- FUNCIÓN PARA FORMATEAR LA LEYENDA ---
    const renderLegendText = (value: string, entry: any) => {
        const { payload } = entry;
        const percentage = ((payload.value / totalValue) * 100).toFixed(1);

        return (
            <span className={styles.legendText}>
                {value} <span className={styles.legendPercentage}>({percentage}%)</span>
            </span>
        );
    };

    //================= RENDERIZADO DEL COMPONENTE ==================
    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 0, right: 0, bottom: 80, left: 0 }}>
                    <Pie
                        data={data}
                        innerRadius="70%"
                        outerRadius="90%"
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-AR')}`} />
                    <Legend
                        iconType="square"
                        formatter={renderLegendText}
                        verticalAlign="bottom"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};