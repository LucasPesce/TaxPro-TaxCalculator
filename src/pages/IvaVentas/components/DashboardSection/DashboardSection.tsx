//================= IMPORTACIONES ==================
import React from 'react';
import { ChartCard } from '../../../../components/ui/ChartCard/ChartCard';
import { type Invoice } from '../../mock-data'; 
import styles from './DashboardSection.module.css';

//========== DEFINICIÓN DE TIPOS Y PROPS ===========
interface DashboardSectionProps {
  invoices: Invoice[];
}

//=============== COMPONENTE PRINCIPAL ===============
export const DashboardSection: React.FC<DashboardSectionProps> = ({invoices }) => {    
    console.log('Datos para los gráficos:', invoices);
    return (
        <div className={styles.dashboardGrid}> 
            <ChartCard title="Control IVA">
                <div className={styles.chartPlaceholder}>Control IVA</div>
            </ChartCard>
            <ChartCard title="Correlatividad">
                 <div className={styles.chartPlaceholder}>Correlatividad</div>
            </ChartCard>
            <ChartCard title="Facturación por Responsable">
                 <div className={styles.chartPlaceholder}>Fact. por Responsable</div>
            </ChartCard>
        </div>
    );

};