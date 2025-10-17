import React from 'react';
// La importación de ChartCard ya apunta al lugar correcto en `ui`
import { ChartCard } from '../../../../components/ui/ChartCard/ChartCard';
import { type Invoice } from '../../mock-data';
// Importamos los estilos locales para la rejilla
import styles from './DashboardSection.module.css';

interface DashboardSectionProps {
  invoices: Invoice[];
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ invoices }) => {
    console.log('Datos para los gráficos:', invoices);

    return (
        <div className={styles.dashboardGrid}>
            <ChartCard title="Control IVA">
                <div className={styles.chartPlaceholder}>Gráfico 1</div>
            </ChartCard>
            <ChartCard title="Correlatividad">
                 <div className={styles.chartPlaceholder}>Gráfico 2</div>
            </ChartCard>
            <ChartCard title="Facturación por Responsable">
                 <div className={styles.chartPlaceholder}>Gráfico 3</div>
            </ChartCard>
        </div>
    );
};