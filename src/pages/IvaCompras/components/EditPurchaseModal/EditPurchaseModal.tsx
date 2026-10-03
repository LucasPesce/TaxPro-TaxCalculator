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

            const fieldsToLock: Record<string, boolean> = {
                proveedor: true, cuitProveedor: true, tipoComprobante: true, fechaEmision: true, fechaImputacion: true,
                netoGravado0: true, netoGravado25: true, iva25: true, netoGravado5: true, iva5: true,
                netoGravado105: true, iva105: true, netoGravado21: true, iva21: true, netoGravado27: true, iva27: true,
                netoNoGravado: true, exento: true, otrosTributos: true, montoGravado: true, iva: true, total: true
            };

            if (isIvaError) {
                fieldsToLock.netoGravado0 = false;
                fieldsToLock.netoGravado25 = false; fieldsToLock.iva25 = false;
                fieldsToLock.netoGravado5 = false;  fieldsToLock.iva5 = false;
                fieldsToLock.netoGravado105 = false; fieldsToLock.iva105 = false;
                fieldsToLock.netoGravado21 = false; fieldsToLock.iva21 = false;
                fieldsToLock.netoGravado27 = false; fieldsToLock.iva27 = false;
                fieldsToLock.netoNoGravado = false; fieldsToLock.exento = false; fieldsToLock.otrosTributos = false;
            }

            setReadOnlyFields(fieldsToLock);
        } else {
            setFormData({
                cuitEmpresa: defaultCuitEmpresa || '', nombreEmpresa: defaultNombreEmpresa || '',
                proveedor: '', cuitProveedor: '', tipoComprobante: 'Factura A', numeroFactura: '',
                fechaEmision: '', fechaImputacion: '',
                montoGravado: 0, netoNoGravado: 0, exento: 0, otrosTributos: 0, iva: 0, total: 0
            });
            setReadOnlyFields({});
        }
    }, [invoice, isOpen, defaultCuitEmpresa, defaultNombreEmpresa]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;
        const newForm = { ...formData, [name]: numValue };

        // A. Autocalcular IVA correspondiente si el usuario modifica un Neto
        if (name === 'netoGravado25') newForm.iva25 = parseFloat((numValue * 0.025).toFixed(2));
        if (name === 'netoGravado5') newForm.iva5 = parseFloat((numValue * 0.05).toFixed(2));
        if (name === 'netoGravado105') newForm.iva105 = parseFloat((numValue * 0.105).toFixed(2));
        if (name === 'netoGravado21') newForm.iva21 = parseFloat((numValue * 0.21).toFixed(2));
        if (name === 'netoGravado27') newForm.iva27 = parseFloat((numValue * 0.27).toFixed(2));

        if (name === 'netoGravado0') newForm.netoNoGravado = numValue;

        // B. Calcular Neto Gravado Total (montoGravado en DB Compras)
        const n25 = parseFloat(String(newForm.netoGravado25)) || 0;
        const n5 = parseFloat(String(newForm.netoGravado5)) || 0;
        const n105 = parseFloat(String(newForm.netoGravado105)) || 0;
        const n21 = parseFloat(String(newForm.netoGravado21)) || 0;
        const n27 = parseFloat(String(newForm.netoGravado27)) || 0;
        newForm.montoGravado = parseFloat((n25 + n5 + n105 + n21 + n27).toFixed(2));

        // C. Calcular Total IVA
        const i25 = parseFloat(String(newForm.iva25)) || 0;
        const i5 = parseFloat(String(newForm.iva5)) || 0;
        const i105 = parseFloat(String(newForm.iva105)) || 0;
        const i21 = parseFloat(String(newForm.iva21)) || 0;
        const i27 = parseFloat(String(newForm.iva27)) || 0;
        newForm.iva = parseFloat((i25 + i5 + i105 + i21 + i27).toFixed(2));

        // D. Calcular Gran Total
        const noGrav = parseFloat(String(newForm.netoNoGravado)) || 0;
        const exentas = parseFloat(String(newForm.exento)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;

        newForm.total = parseFloat((newForm.montoGravado + noGrav + exentas + newForm.iva + otros).toFixed(2));
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
                    
                    <Input label="Neto 2.5%" name="netoGravado25" type="number" value={formData.netoGravado25 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado25} />
                    <Input label="IVA 2.5%" name="iva25" type="number" value={formData.iva25 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva25} />

                    <Input label="Neto 5%" name="netoGravado5" type="number" value={formData.netoGravado5 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado5} />
                    <Input label="IVA 5%" name="iva5" type="number" value={formData.iva5 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva5} />

                    <Input label="Neto 10.5%" name="netoGravado105" type="number" value={formData.netoGravado105 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado105} />
                    <Input label="IVA 10.5%" name="iva105" type="number" value={formData.iva105 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva105} />

                    <Input label="Neto 21%" name="netoGravado21" type="number" value={formData.netoGravado21 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado21} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva21} />

                    <Input label="Neto 27%" name="netoGravado27" type="number" value={formData.netoGravado27 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado27} />
                    <Input label="IVA 27%" name="iva27" type="number" value={formData.iva27 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.iva27} />

                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-color)', margin: '8px 0', paddingBottom: '4px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Otros Conceptos y Totales</div>

                    <Input label="Neto 0%" name="netoGravado0" type="number" value={formData.netoGravado0 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado0} title="Al modificarlo, se igualará automáticamente al Neto No Gravado" />
                    <Input label="Neto No Gravado" name="netoNoGravado" type="number" value={formData.netoNoGravado || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoNoGravado} />
                    <Input label="Op. Exentas" name="exento" type="number" value={formData.exento || ''} onChange={handleAmountChange} readOnly={readOnlyFields.exento} />
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} readOnly={readOnlyFields.otrosTributos} />

                    <Input label="Neto Gravado Total" name="montoGravado" type="number" value={formData.montoGravado || ''} readOnly style={{ backgroundColor: 'var(--background-color)' }} />
                    <Input label="Total IVA" name="iva" type="number" value={formData.iva || ''} readOnly style={{ backgroundColor: 'var(--background-color)' }} />
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Input label="Total Comprobante" name="total" type="number" value={formData.total || ''} readOnly style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-color)', backgroundColor: 'var(--background-color)' }} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};