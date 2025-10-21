//================= IMPORTACIONES ==================
import React, { useMemo } from 'react';
import { ChartCard } from '../../../../components/ui/ChartCard/ChartCard';
import { type Invoice } from '../../mock-data';
import { PercentageChart } from '../../../../components/ui/PercentageChart/PercentageChart';
import { MultiSegmentChart } from '../../../../components/ui/MultiSegmentChart/MultiSegmentChart';
import styles from './DashboardSection.module.css';


//========== DEFINICIÓN DE TIPOS Y PROPS ===========
interface DashboardSectionProps {
    invoices: Invoice[];
}

//================= CONSTANTES DE COLORES ==================
const COLORS_IVA = ['#0099ffff', '#db0012']; // Celeste para Correcto, Naranja para Error
const COLORS_CORRELATIVIDAD = ['#0099ffff', '#db0012']; // Mismos colores
const COLORS_PROVINCE = ['#2196F3', '#F44336', '#ff8000dd', '#7300ffff', '#d2e100ff', '#00c0aaff']; 


//=============== COMPONENTE PRINCIPAL ===============
export const DashboardSection: React.FC<DashboardSectionProps> = ({ invoices }) => {

    //================= CÁLCULO DE DATOS PARA GRÁFICOS ==================
    const ivaChartData = useMemo(() => {
        const correct = invoices.filter(inv => inv.controlIva === 'Correcto').length;
        const error = invoices.filter(inv => inv.controlIva === 'Error').length;
        return [{ name: 'Correcto', value: correct }, { name: 'Error', value: error }];
    }, [invoices]);

    const correlatividadChartData = useMemo(() => {
        const correct = invoices.filter(inv => inv.correlatividad === 'Correcto').length;
        const error = invoices.filter(inv => inv.correlatividad === 'Error').length;
        return [{ name: 'Correcto', value: correct }, { name: 'Error', value: error }];
    }, [invoices]);

    console.log('Datos para los gráficos:', invoices);

    const provinceChartData = useMemo(() => {
        const totalsByProvince = invoices.reduce((acc, invoice) => {
            const province = invoice.provincia || 'Sin Definir';
            acc[province] = (acc[province] || 0) + invoice.total;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(totalsByProvince)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor
    }, [invoices]);

//================= RENDERIZADO ==================
    return (
        <div className={styles.dashboardGrid}>
            <ChartCard title="Control IVA">
                {invoices.length > 0 ? (
                    <PercentageChart data={ivaChartData} colors={COLORS_IVA} />
                ) : (
                    <div className={styles.chartPlaceholder}>Sin datos</div>
                )}
            </ChartCard>
            <ChartCard title="Correlatividad">
                {invoices.length > 0 ? (
                    <PercentageChart data={correlatividadChartData} colors={COLORS_CORRELATIVIDAD} />
                ) : (
                    <div className={styles.chartPlaceholder}>Sin datos</div>
                )}
            </ChartCard>
            <ChartCard title="Facturación por Provincia">
                 {invoices.length > 0 ? (
                    <MultiSegmentChart data={provinceChartData} colors={COLORS_PROVINCE} />
                 ) : (
                    <div className={styles.chartPlaceholder}>Sin datos</div>
                 )}
            </ChartCard>
        </div>
    );
};