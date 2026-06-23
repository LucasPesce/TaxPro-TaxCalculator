//================= IMPORTACIONES ==================
import React, { useMemo } from 'react';
import { ChartCard } from '../../../../components/ui/ChartCard/ChartCard';
import { type Invoice } from '../../../../types';
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
const COLORS_TYPE = [
    '#00aeff',
    '#e91e63',
    '#e2c60f',
    '#9c27b0',
    '#ff8400',
    '#2cd7af',
    '#ff00e1',
    '#003ba9',
    '#3e4d63',
    '#9bb7c6'
];

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

    const invoiceTypeChartData = useMemo(() => {
        const totalsByType = invoices.reduce((acc, invoice) => {
            const type = invoice.tipoComprobante || 'Otros';

            // Normalizamos códigos numéricos de AFIP a nombres legibles si es necesario
            let typeLabel = type;
            if (type === '1' || type === 'Factura A') typeLabel = 'Factura A';
            else if (type === '6' || type === 'Factura B') typeLabel = 'Factura B';
            else if (type === '11' || type === 'Factura C') typeLabel = 'Factura C';
            else if (type === '3' || type === 'Nota de Crédito A') typeLabel = 'Nota de Crédito A';
            else if (type === '8' || type === 'Nota de Crédito B') typeLabel = 'Nota de Crédito B';

            acc[typeLabel] = (acc[typeLabel] || 0) + invoice.total;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(totalsByType)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
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
            <ChartCard title="Tipo de Comprobante">
                {invoices.length > 0 ? (
                    <MultiSegmentChart data={invoiceTypeChartData} colors={COLORS_TYPE} />
                ) : (
                    <div className={styles.chartPlaceholder}>Sin datos</div>
                )}
            </ChartCard>
        </div>
    );
};