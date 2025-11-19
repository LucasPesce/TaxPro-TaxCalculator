//================= IMPORTACIONES ==================
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './PercentageChart.module.css';

//================= DEFINICIÓN DE TIPOS ==================
interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface PercentageChartProps {
    data: ChartData[];
    colors: string[];
}

//================= COMPONENTE PRINCIPAL ==================
export const PercentageChart: React.FC<PercentageChartProps> = ({ data, colors }) => {
    
    const totalValue = data.reduce((acc, entry) => acc + entry.value, 0);
    
    if (totalValue === 0) {
        return <div className={styles.chartPlaceholder}>Sin datos suficientes</div>;
    }
    
    //================= RENDERIZADO DEL COMPONENTE ==================
    return (
        <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
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
                        {data.map((_, index) =>  (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${((value / totalValue) * 100).toFixed(1)}%`} />
                    <Legend verticalAlign="bottom" height={36} iconType="square" />
                </PieChart>
            </ResponsiveContainer>
            
            <div className={styles.chartCenterText}>
                <span>{`${((data[0].value / totalValue) * 100).toFixed(0)}%`}</span>
            </div>
        </div>
    );
};