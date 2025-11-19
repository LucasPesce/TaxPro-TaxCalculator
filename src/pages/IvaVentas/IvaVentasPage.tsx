import React, { useState } from 'react';
import './IvaVentas.css';
import { type Invoice } from '../../types';
import { useInvoicesManager } from './hooks/useInvoicesManager';
import { FiltersSection } from './components/FiltersSection/FiltersSection';
import { DashboardSection } from './components/DashboardSection/DashboardSection';
import { InvoicesTable } from './components/InvoicesTable/InvoicesTable';
import { EditInvoiceModal } from './components/EditInvoiceModal/EditInvoiceModal';
import { Button } from '../../components/ui/Button/Button';
import { Pagination } from '../../components/ui/Pagination/Pagination';


export const IvaVentasPage: React.FC = () => {
    //================= LÓGICA Y ESTADO PRINCIPAL (HOOK) =================
    const {
        invoices,
        totalInvoices,
        allInvoices,
        sortConfig,
        currentPage,
        ITEMS_PER_PAGE,
        handleFileImport,
        handleSearch,
        handleSort,
        setCurrentPage,
        handleUpdateInvoice,
        hasErrors,
        handleImpactData
    } = useInvoicesManager();

    //================= ESTADO DEL MODAL DE EDICIÓN =================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    //================= MANEJADORES DE EVENTOS DEL MODAL =================
    const handleEditInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    //================= RENDERIZADO DEL COMPONENTE (JSX) =================
    return (
        <div className="iva-ventas-page">
            <h1 className="page-title">IVA Ventas</h1>

            <FiltersSection onFileImport={handleFileImport} onSearch={handleSearch}
            />
            <DashboardSection invoices={allInvoices} />

            <InvoicesTable
                invoices={invoices}
                onEdit={handleEditInvoice}
                onSort={handleSort}
                sortConfig={sortConfig}
            />

            <Pagination
                currentPage={currentPage}
                totalItems={totalInvoices}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={page => setCurrentPage(page)}
            />

            <div className="page-actions">
                <Button
                    variant="primary"
                    disabled={hasErrors} // Se deshabilita si hay errores
                    onClick={() => {
                        // AQUÍ NECESITAMOS EL CUIT Y PERIODO ACTUAL.
                        // Como están en FiltersSection encapsulados, por ahora pediremos confirmación simple.
                        const cuit = prompt("Confirmar CUIT a impactar:");
                        const periodo = prompt("Confirmar Periodo (YYYY-MM):");
                        if (cuit && periodo) handleImpactData(cuit, periodo);
                    }}
                >
                    Impactar datos
                </Button>             
            </div>


            <EditInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                invoice={selectedInvoice}
                onSave={handleUpdateInvoice}
            />
        </div>
    );
};