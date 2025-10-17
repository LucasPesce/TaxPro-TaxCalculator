// src/pages/IvaVentas/components/EditInvoiceModal/EditInvoiceModal.tsx

import React, { useState, useEffect } from 'react';
import { type Invoice } from '../../mock-data';

// --- CAMBIOS CLAVE ---
// 1. Importamos nuestros nuevos componentes de UI
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
// 2. Importamos los estilos del MÓDULO (el archivo que renombraste)
import styles from './EditInvoiceModal.module.css';

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
    const [formData, setFormData] = useState<Partial<Invoice>>({});

    useEffect(() => { if (invoice) { setFormData(invoice); } }, [invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Guardando cambios... (Lógica no implementada)');
        onClose();
    };

    if (!invoice) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Registro de Factura"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" type="submit" onClick={handleSaveChanges}>Guardar Cambios</Button>
                </>
            }
        >
            <form onSubmit={handleSaveChanges} className={styles.editForm}>
                {/* 3. Reemplazamos los divs por nuestro componente <Input> */}
                <div className={styles.formGrid}>
                    <Input label="Cliente" name="cliente" type="text" value={formData.cliente || ''} onChange={handleChange} />
                    <Input label="Cond. IVA" name="condIva" type="text" value={formData.condIva || ''} onChange={handleChange} />
                    <Input label="Documento" name="doc" type="text" value={formData.doc || ''} onChange={handleChange} />
                    <Input label="Fecha" name="fecha" type="text" value={formData.fecha || ''} onChange={handleChange} />
                    <Input label="Nro. Comprobante" name="nro" type="text" value={formData.nro || ''} readOnly />
                    <Input label="Monto Gravado" name="montoGravado" type="number" value={formData.montoGravado || 0} onChange={handleChange} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || 0} onChange={handleChange} />
                    <Input label="Perc. IIBB" name="percIIBB" type="number" value={formData.percIIBB || 0} onChange={handleChange} />
                    <Input label="Perc. Municipal" name="percMun" type="number" value={formData.percMun || 0} onChange={handleChange} />
                    <Input label="Provincia" name="provincia" type="text" value={formData.provincia || ''} onChange={handleChange} />
                    <Input label="Total" name="total" type="number" value={formData.total || 0} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};