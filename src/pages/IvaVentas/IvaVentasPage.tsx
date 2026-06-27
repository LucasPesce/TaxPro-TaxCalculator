import React, { useState } from 'react';
import './IvaVentas.css';
import { type Invoice } from '../../types';
import { useInvoicesManager } from '../../hooks/useInvoicesManager';
import { FiltersSection } from '../../components/ui/FiltersSection/FiltersSection';
import { DashboardSection } from './components/DashboardSection/DashboardSection';
import { InvoicesTable } from './components/InvoicesTable/InvoicesTable';
import { EditInvoiceModal } from './components/EditInvoiceModal/EditInvoiceModal';
import { Button } from '../../components/ui/Button/Button';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { faTrashArrowUp } from '@fortawesome/free-solid-svg-icons';
import { checkAction, getCurrentUser } from '../../utils/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';


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
        handleImpactData,
        handleDeletePeriod 
    } = useInvoicesManager();

    const currentUser = getCurrentUser();
    const userRol = currentUser?.rol;

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

            <FiltersSection
                modulo="ventas"
                onFileImport={handleFileImport}
                onSearch={handleSearch}
                hasData={allInvoices.length > 0} 
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

<div className="page-actions" style={{ display: 'flex', gap: '12px' }}>
                
                {/* BOTÓN CU-025: SOLO GERENTE (O ADMIN GRAL) */}
                {checkAction(userRol, 'EliminarProceso') && (
                    <Button
                        variant="secondary" style={{ color: '#d32f2f', borderColor: '#d32f2f' }}
                        disabled={allInvoices.length === 0} 
                        onClick={() => {
                            // 👇 LECTURA AUTOMÁTICA DE FILTROS 👇
                            const cuit = (document.getElementsByName('entidad')[0] as HTMLSelectElement)?.value;
                            const periodo = (document.getElementsByName('periodo')[0] as HTMLSelectElement)?.value;
                            if (cuit && periodo) handleDeletePeriod(cuit, periodo);
                            else toast.warning("Por favor, seleccione una Empresa y un Periodo para esta acción.");
                        }}
                    >
                        <FontAwesomeIcon icon={faTrashArrowUp} /> Deshacer Liquidación
                    </Button>
                )}

                {/* BOTÓN CU-020: SOLO SUPERVISOR (O ADMIN GRAL) */}
                {checkAction(userRol, 'Liquidar') && (
                    <Button
                        variant="primary"
                        disabled={hasErrors || allInvoices.length === 0} 
                        onClick={() => {
                            // 👇 LECTURA AUTOMÁTICA DE FILTROS 👇
                            const cuit = (document.getElementsByName('entidad')[0] as HTMLSelectElement)?.value;
                            const periodo = (document.getElementsByName('periodo')[0] as HTMLSelectElement)?.value;
                            if (cuit && periodo) handleImpactData(cuit, periodo);
                            else toast.warning("Por favor, seleccione una Empresa y un Periodo para esta acción.");
                        }}
                    >
                        Impactar datos (Liquidar)
                    </Button>
                )}
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