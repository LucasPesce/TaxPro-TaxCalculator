import React, { useState, useEffect } from 'react';
import { type Invoice } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import styles from './EditInvoiceModal.module.css';

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onSave: (invoice: Invoice) => void;
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoice, onSave }) => {
    const [formData, setFormData] = useState<Partial<Invoice>>({});
    const [readOnlyFields, setReadOnlyFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (invoice) {
            setFormData({ ...invoice });
            const isIvaError = invoice.controlIva === 'Error';
            const isCompletenessError = invoice.correlatividad === 'Error';

            const fieldsToLock: Record<string, boolean> = {
                denominacionReceptor: true, nroDocReceptor: true, tipoComprobante: true,
                fecha: true, montoGravadoTotal: true, iva21: true, otrosTributos: true, total: true
            };

            if (isIvaError) {
                fieldsToLock.montoGravadoTotal = false;
                fieldsToLock.iva21 = false;
                fieldsToLock.otrosTributos = false;
            }

            if (isCompletenessError) {
                fieldsToLock.denominacionReceptor = false;
                fieldsToLock.nroDocReceptor = false;
                fieldsToLock.tipoComprobante = false;
                fieldsToLock.fecha = false;
                fieldsToLock.montoGravadoTotal = false;
                fieldsToLock.iva21 = false;
                fieldsToLock.otrosTributos = false;
            }

            setReadOnlyFields(fieldsToLock);
        }
    }, [invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;

        const newForm = { ...formData, [name]: numValue };

        // Autocalcular el total
        const gravado = parseFloat(String(newForm.montoGravadoTotal)) || 0;
        const iva21 = parseFloat(String(newForm.iva21)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;

        newForm.total = gravado + iva21 + otros;
        setFormData(newForm);
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (invoice) {
            onSave({ ...invoice, ...formData } as Invoice);
        }
        onClose();
    };

    if (!invoice) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Editar Factura: ${invoice.numeroFactura}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" type="submit" onClick={handleSaveChanges}>Guardar Cambios</Button>
                </>
            }
        >
            <form onSubmit={handleSaveChanges} className={styles.editForm}>
                <div className={styles.formGrid}>
                    <Input label="Receptor (Cliente)" name="denominacionReceptor" value={formData.denominacionReceptor || ''} onChange={handleChange} readOnly={readOnlyFields.denominacionReceptor} />
                    <Input label="CUIT/DNI" name="nroDocReceptor" value={formData.nroDocReceptor || ''} onChange={handleChange} readOnly={readOnlyFields.nroDocReceptor} />
                    <Input label="Comprobante" name="tipoComprobante" value={formData.tipoComprobante || ''} onChange={handleChange} readOnly={readOnlyFields.tipoComprobante} />
                    <Input label="Fecha (DD/MM/YYYY)" name="fecha" value={formData.fecha || ''} onChange={handleChange} readOnly={readOnlyFields.fecha} />
                    <Input label="Número" name="numeroFactura" value={formData.numeroFactura || ''} readOnly />

                    <Input label="Monto Gravado Total" name="montoGravadoTotal" type="number" value={formData.montoGravadoTotal || ''} onChange={handleAmountChange} readOnly={readOnlyFields.montoGravadoTotal} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva21} />
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} readOnly={readOnlyFields.otrosTributos} />
                    <Input label="Total" name="total" type="number" value={formData.total || ''} readOnly style={{ fontWeight: 'bold' }} />                </div>
            </form>
        </Modal>
    );
};