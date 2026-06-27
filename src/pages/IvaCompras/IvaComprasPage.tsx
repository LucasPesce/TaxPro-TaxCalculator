import React, { useMemo } from 'react';
import { useState } from 'react';
import { EditPurchaseModal } from './components/EditPurchaseModal/EditPurchaseModal';
import { checkAction, getCurrentUser } from '../../utils/auth';

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
        handleCreateInvoice

    } = useIvaComprasManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // Detectar empresa actual (truco rápido: sacarlo de la primera factura cargada)
    const currentCuit = allInvoices[0]?.cuitEmpresa || "";
    const currentName = allInvoices[0]?.nombreEmpresa || "";

    // 2. Cálculos para el Dashboard (Memoizados)
    const ivaChartData = useMemo(() => {
        const correct = allInvoices.filter(inv => inv.controlIva === 'Correcto').length;
        const error = allInvoices.filter(inv => inv.controlIva === 'Error').length;
        // Evitar gráfico vacío
        if (correct === 0 && error === 0) return [];
        return [{ name: 'Correcto', value: correct }, { name: 'Error', value: error }];
    }, [allInvoices]);

    // Índice RECO (Ejemplo: % de facturas que son "Bienes de Uso" vs Total)
    // O podrías calcularlo según lógica fiscal real. Aquí simulo un porcentaje simple.
    const recoIndexData = useMemo(() => {
        if (allInvoices.length === 0) return [];
        // Ejemplo: Supongamos que RECO es un índice de eficiencia, por ahora fijo o calculado
        return [{ name: 'Índice', value: 62 }, { name: 'Resto', value: 38 }];
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

                {/* 2. Índice RECO */}
                <ChartCard title="Índice RECO">
                    {recoIndexData.length > 0 ?
                        <PercentageChart data={recoIndexData} colors={COLORS_RECO} /> :
                        <span>Sin datos</span>
                    }
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
            />

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalItems={totalInvoices}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
            <div className="page-actions">
                {checkAction(userRol, 'Liquidar') && (
                    <Button
                        variant="primary"
                        disabled={hasErrors || allInvoices.length === 0}
                        onClick={() => {
                            const cuit = prompt("Confirmar CUIT a impactar:");
                            const periodo = prompt("Confirmar Periodo (YYYY-MM):");
                            if (cuit && periodo) handleImpactData(cuit, periodo);
                        }}
                    >
                        Impactar datos (Liquidar)
                    </Button>
                )}
            </div>

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