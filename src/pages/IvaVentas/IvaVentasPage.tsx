import React, { useState } from 'react';
import { mockInvoices, type Invoice } from './mock-data'; // Importamos nuestros datos falsos
import './IvaVentas.css'; // Importamos los estilos para esta página

// Importaremos los componentes que vamos a crear a continuación
import { FiltersSection } from './components/FiltersSection/FiltersSection';
import { DashboardSection } from './components/DashboardSection/DashboardSection';
import { InvoicesTable } from './components/InvoicesTable/InvoicesTable';
import { EditInvoiceModal } from './components/EditInvoiceModal/EditInvoiceModal';
import { Button } from '../../components/ui/Button/Button';

export const IvaVentasPage: React.FC = () => {
    // === ESTADO PARA CONTROLAR EL MODAL ===
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Este estado guardará la factura completa que se está editando.
    // Usamos `Invoice | null` para indicar que puede ser una factura o nada (null).
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // === FUNCIONES PARA MANEJAR EL MODAL ===
    // Esta función se llamará desde la tabla cuando se haga clic en el lápiz.
    const handleEditInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice); // Guardamos la factura seleccionada
        setIsModalOpen(true);        // Abrimos el modal
    };

    // Esta función se pasará al modal para que pueda cerrarse.
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInvoice(null); // Limpiamos la factura seleccionada
    };


    return (
        <div className="iva-ventas-page">
            <h1 className="page-title">IVA Ventas</h1>

            <FiltersSection />
            <DashboardSection invoices={mockInvoices} /> {/* Pasamos los datos al dashboard */}
            <InvoicesTable invoices={mockInvoices} onEdit={handleEditInvoice} />

            <div className="page-actions">
                <Button variant="primary" disabled>
                    Impactar datos
                </Button>
            </div>
            <EditInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                invoice={selectedInvoice}
            />
        </div>
    );
};