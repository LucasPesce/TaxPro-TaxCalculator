import React, { useMemo } from 'react';
import { useState } from 'react';
import { EditPurchaseModal } from './components/EditPurchaseModal/EditPurchaseModal';
import { getCurrentUser } from '../../utils/auth';

import './IvaComprasPage.css';

// Hooks
import { useIvaComprasManager } from '../../hooks/useIvaComprasManager';

// Componentes UI
import { FiltersSection } from '../../components/ui/FiltersSection/FiltersSection'; // Reutilizamos filtros
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { ChartCard } from '../../components/ui/ChartCard/ChartCard';
import { PercentageChart } from '../../components/ui/PercentageChart/PercentageChart';
import { Button } from '../../components/ui/Button/Button';

// Componentes Específicos de Compras
import { InvoicesPurchaseTable } from './components/InvoicesPurchaseTable/InvoicesPurchaseTable';
import { CostTypeChart } from './components/CostTypeChart/CostTypeChart';

const COLORS_IVA = ['#2196F3', '#db0012']; // Verde correcto, Rojo error
const COLORS_RECO = ['#2196F3', '#e0e0e0'];   // Azul para índice, gris fondo

const currentUser = getCurrentUser();
const userRol = currentUser?.rol;

export const IvaComprasPage: React.FC = () => {
    // 1. Usamos el Hook
    const {
        invoices,
        totalInvoices,
        allInvoices, // Necesario para los gráficos (todos los datos, no solo la página actual)
        sortConfig,
        currentPage,
        ITEMS_PER_PAGE,
        handleFileImport,
        handleSearch,
        handleSort,
        setCurrentPage,
        handleUpdateInvoice,
        hasErrors,
        handleImpactData,
        handleQuickEditClasificacion,
        handleCreateInvoice

    } = useIvaComprasManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // Detectar empresa actual (truco rápido: sacarlo de la primera factura cargada)
    const currentCuit = allInvoices[0]?.cuitEmpresa || "";
    const currentName = allInvoices[0]?.nombreEmpresa || "";

    // 2. Cálculos para el Dashboard (Memoizados)
    const ivaChartData = useMemo(() => {
        const correct = allInvoices.filter(inv => inv.controlIva === 'Validado').length;
        const error = allInvoices.filter(inv => inv.controlIva === 'Observado').length;
        // Evitar gráfico vacío
        if (correct === 0 && error === 0) return [];
        return [{ name: 'Validado', value: correct }, { name: 'Observado', value: error }];
    }, [allInvoices]);

    // Clasificación de Gastos (Reemplazo del Índice RECO)
    const classificationData = useMemo(() => {
        const grouped: Record<string, number> = {};
        allInvoices.forEach(inv => {
            // Limpiamos etiquetas como "(Sugerido)" para unificar rubros
            const clase = inv.clasificacion ? inv.clasificacion.replace(/\s*\(.*?\)\s*/g, '') : "Otros";
            grouped[clase] = (grouped[clase] || 0) + (inv.montoGravado || 0);
        });

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [allInvoices]);

    const openEditModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        if (!currentCuit) {
            alert("Para crear, primero debe haber importado facturas o seleccionado una empresa (contexto).");
            return;
        }
        setSelectedInvoice(null); // Modo crear
        setIsModalOpen(true);
    };

    const handleSaveFromModal = (invoiceData: any) => {
        if (selectedInvoice) {
            handleUpdateInvoice(invoiceData);
        } else {
            handleCreateInvoice(invoiceData);
        }
        setIsModalOpen(false);
    };

    const currentUser = getCurrentUser();
    const userRol = currentUser?.rol;
    // 3. Renderizado
    return (
        <div className="iva-compras-page">
            <h1 className="page-title">IVA Compras</h1>

            {/* Filtros (Reutilizados de Ventas) */}
            <FiltersSection
                modulo="compras"
                onFileImport={handleFileImport}
                onSearch={handleSearch}
                hasData={allInvoices.length > 0}
            />

            {/* Dashboard de 4 Paneles */}
            <div className="dashboard-grid">
                {/* 1. Control IVA */}
                <ChartCard title="Control IVA">
                    {ivaChartData.length > 0 ?
                        <PercentageChart data={ivaChartData} colors={COLORS_IVA} /> :
                        <span>Sin datos</span>
                    }
                </ChartCard>

 {/* 2. Resumen por Clasificación */}
                <ChartCard title="Monto Neto por Clasificación">
                    {classificationData.length > 0 ? (
                        <div style={{ width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '8px', color: 'var(--text-muted-color)' }}>Rubro</th>
                                        <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted-color)' }}>Monto Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classificationData.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '8px', fontWeight: '600' }}>{item.name}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>
                                                ${item.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: 'var(--background-color)', fontWeight: 'bold' }}>
                                        <td style={{ padding: '8px' }}>TOTAL</td>
                                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--primary-color)' }}>
                                            ${classificationData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <span>Sin datos</span>
                    )}
                </ChartCard>

                {/* 3. Total por Tipo de Comprobante) */}
                <ChartCard title="Tipo de Comprobante">
                    <CostTypeChart invoices={allInvoices} />
                </ChartCard>
            </div>

            {/* Tabla Principal */}
            <InvoicesPurchaseTable
                invoices={invoices}
                onSort={handleSort as any}
                onUpdate={handleUpdateInvoice}
                sortConfig={sortConfig}
                onEdit={openEditModal}
                onQuickEditClasificacion={handleQuickEditClasificacion}
            />

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalItems={totalInvoices}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />

            <EditPurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                invoice={selectedInvoice}
                onSave={handleSaveFromModal}
                defaultCuitEmpresa={currentCuit}
                defaultNombreEmpresa={currentName}
            />
        </div>

    );
};