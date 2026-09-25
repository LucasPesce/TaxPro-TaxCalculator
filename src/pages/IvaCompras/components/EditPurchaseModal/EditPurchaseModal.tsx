import React, { useState, useEffect } from 'react';
import { type PurchaseInvoice } from '../../../../../src/types';
import { Modal } from '../../../../../src/components/ui/Modal/Modal';
import { Button } from '../../../../../src/components/ui/Button/Button';
import { Input } from '../../../../../src/components/ui/Input/Input';
import styles from './EditPurchaseModal.module.css';

interface EditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: PurchaseInvoice | null;
    onSave: (invoice: PurchaseInvoice) => void;
    defaultCuitEmpresa?: string;
    defaultNombreEmpresa?: string;
}

export const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({
    isOpen, onClose, invoice, onSave, defaultCuitEmpresa, defaultNombreEmpresa
}) => {
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>({});
    const [readOnlyFields, setReadOnlyFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (invoice) {
            setFormData({ ...invoice });
            const isIvaError = invoice.controlIva === 'Observado';

            // Por defecto todo bloqueado
            const fieldsToLock: Record<string, boolean> = {
                proveedor: true, cuitProveedor: true, tipoComprobante: true, fechaEmision: true, fechaImputacion: true,
                montoGravado: true, iva21: true, iva105: true, iva27: true, netoNoGravado: true, exento: true, otrosTributos: true, iva: true, total: true
            };

            // Si hay error, habilitamos campos editables
            if (isIvaError) {
                fieldsToLock.montoGravado = false;
                fieldsToLock.iva21 = false;
                fieldsToLock.iva105 = false;
                fieldsToLock.iva27 = false;
                fieldsToLock.netoNoGravado = false;
                fieldsToLock.exento = false;
                fieldsToLock.otrosTributos = false;
            }

            setReadOnlyFields(fieldsToLock);
        } else {
            setFormData({
                cuitEmpresa: defaultCuitEmpresa || '', nombreEmpresa: defaultNombreEmpresa || '',
                proveedor: '', cuitProveedor: '', tipoComprobante: 'Factura A', numeroFactura: '',
                fechaEmision: '', fechaImputacion: '',
                montoGravado: 0, netoNoGravado: 0, exento: 0, otrosTributos: 0, iva105: 0, iva21: 0, iva27: 0, iva: 0, total: 0
            });
            setReadOnlyFields({}); // Al crear, todo libre
        }
    }, [invoice, isOpen, defaultCuitEmpresa, defaultNombreEmpresa]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        const newForm = { ...formData, [name]: numValue };

        // Sumamos dinámicamente las alícuotas
        const i105 = parseFloat(String(newForm.iva105)) || 0;
        const i21 = parseFloat(String(newForm.iva21)) || 0;
        const i27 = parseFloat(String(newForm.iva27)) || 0;
        newForm.iva = parseFloat((i105 + i21 + i27).toFixed(2));

        // Calculamos Gran Total
        const gravado = parseFloat(String(newForm.montoGravado)) || 0;
        const exento = parseFloat(String(newForm.exento)) || 0;
        const noGravado = parseFloat(String(newForm.netoNoGravado)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;

        newForm.total = parseFloat((gravado + exento + noGravado + otros + newForm.iva).toFixed(2));
        setFormData(newForm);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, controlIva: 'Editado' } as PurchaseInvoice);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={invoice ? `Editar Compra: ${invoice.numeroFactura}` : "Nueva Compra"}
            footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={handleSubmit}>Guardar</Button></>}
        >
            <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.formGrid}>
                    <Input label="Proveedor" name="proveedor" value={formData.proveedor || ''} onChange={handleChange} readOnly={readOnlyFields.proveedor} required />
                    <Input label="CUIT Prov." name="cuitProveedor" type="number" value={formData.cuitProveedor || ''} onChange={handleChange} readOnly={readOnlyFields.cuitProveedor} required />
                    <Input label="Tipo Comprobante" name="tipoComprobante" value={formData.tipoComprobante || ''} onChange={handleChange} readOnly={readOnlyFields.tipoComprobante} required />
                    
                    <Input label="Fecha Emisión" name="fechaEmision" type="date" value={formData.fechaEmision || ''} onChange={handleChange} readOnly={readOnlyFields.fechaEmision} required />
                    <Input label="Fecha Imputación" name="fechaImputacion" type="date" value={formData.fechaImputacion || ''} onChange={handleChange} readOnly={readOnlyFields.fechaImputacion} required />
                    <Input label="Nro. Factura" name="numeroFactura" value={formData.numeroFactura || ''} onChange={handleChange} readOnly={readOnlyFields.numeroFactura} required />

                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-color)', margin: '8px 0', paddingBottom: '4px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Bases e Impuestos</div>
                    
                    <Input label="Imp. Neto Gravado" name="montoGravado" type="number" value={formData.montoGravado || ''} onChange={handleAmountChange} readOnly={readOnlyFields.montoGravado} required />
                    <Input label="IVA 10.5%" name="iva105" type="number" value={formData.iva105 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva105} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva21} />
                    <Input label="IVA 27%" name="iva27" type="number" value={formData.iva27 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva27} />
                    <Input label="Imp. Neto No Gravado" name="netoNoGravado" type="number" value={formData.netoNoGravado || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoNoGravado} />
                    <Input label="Imp. Op. Exentas" name="exento" type="number" value={formData.exento || ''} onChange={handleAmountChange} readOnly={readOnlyFields.exento} />
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} readOnly={readOnlyFields.otrosTributos} />

                    <Input label="Total IVA" name="iva" type="number" value={formData.iva || ''} readOnly style={{ backgroundColor: 'var(--background-color)' }} />
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Input label="Total Comprobante" name="total" type="number" value={formData.total || ''} readOnly style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-color)' }} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};