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

    // === NUEVO: Estado para facturas (mock o importadas)
    const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
    // funcion para importar archivo csv
    const handleFileImport = (file: File) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');

            if (lines.length < 2) return; // si no hay datos

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            //  Mapa para encabezados CSV - CAMBIOS 15/10
                const headerMap: Record<string, keyof Invoice> = {
                                'cliente': 'cliente',
                                'cond._iva': 'condIva',
                                'doc.': 'docNumero',
                                'fecha': 'fecha',
                                'comprobante': 'doc',
                                'nro': 'nro',
                                'monto_gravado': 'montoGravado',
                                'iva_21%': 'iva21',
                                'perc. ii.bb.': 'percIIBB',
                                'per. mun.': 'percMun',
                                'total': 'total',
                                'provincia': 'provincia'
            };

            const parsedInvoices: Invoice[] = lines.slice(1).map((line, rowIndex) => {
                const values = line.split(',');
                const obj: any = {id: rowIndex + 1 };

                 headers.forEach((header, index) => {
                    const key = headerMap[header] || header; // 🔹 usamos el mapa si existe
                    const rawValue = values[index]?.trim().replace(/^"|"$/g, ''); 
                    obj[key] = rawValue; // 🔹 guarda el valor tal cual viene del CSV
                });
            return obj as Invoice;
            });
            console.log('📦 Facturas importadas:', parsedInvoices);
            setInvoices(parsedInvoices);
        };

        reader.readAsText(file);
    };

    return (
        <div className="iva-ventas-page">
            <h1 className="page-title">IVA Ventas</h1>
            
            <FiltersSection onFileImport={handleFileImport} /> 
            <DashboardSection invoices={invoices} />
            <InvoicesTable invoices={invoices} onEdit={handleEditInvoice} />


            <div className="page-actions">
                <Button variant="primary">Impactar datos</Button> {/* DESACTIVADO /////////////////////////// */}
            </div>

            <EditInvoiceModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                invoice={selectedInvoice}
            />
        </div>
    );
};