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
            const isIvaError = invoice.controlIva === 'Observado';
            const isCompletenessError = invoice.correlatividad === 'Observado';

            // 1. Bloqueamos por defecto todo
            const fieldsToLock: Record<string, boolean> = {
                denominacionReceptor: true, nroDocReceptor: true, tipoComprobante: true, fecha: true,
                netoGravado0: true, netoGravado25: true, iva25: true, netoGravado5: true, iva5: true,
                netoGravado105: true, iva105: true, netoGravado21: true, iva21: true, netoGravado27: true, iva27: true,
                netoNoGravado: true, operacionesExentas: true, otrosTributos: true,
                montoGravadoTotal: true, totalIva: true, total: true
            };

            // 2. Si hay errores (de IVA o Correlatividad), desbloqueamos los campos editables
            if (isIvaError || isCompletenessError) {
                fieldsToLock.netoGravado0 = false;
                fieldsToLock.netoGravado25 = false; fieldsToLock.iva25 = false;
                fieldsToLock.netoGravado5 = false; fieldsToLock.iva5 = false;
                fieldsToLock.netoGravado105 = false; fieldsToLock.iva105 = false;
                fieldsToLock.netoGravado21 = false; fieldsToLock.iva21 = false;
                fieldsToLock.netoGravado27 = false; fieldsToLock.iva27 = false;
                fieldsToLock.netoNoGravado = false;
                fieldsToLock.operacionesExentas = false;
                fieldsToLock.otrosTributos = false;

                if (isCompletenessError) {
                    fieldsToLock.denominacionReceptor = false;
                    fieldsToLock.nroDocReceptor = false;
                    fieldsToLock.tipoComprobante = false;
                    fieldsToLock.fecha = false;
                }
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

        // A. Autocalcular IVA correspondiente si el usuario modifica un Neto
        if (name === 'netoGravado25') newForm.iva25 = parseFloat((numValue * 0.025).toFixed(2));
        if (name === 'netoGravado5') newForm.iva5 = parseFloat((numValue * 0.05).toFixed(2));
        if (name === 'netoGravado105') newForm.iva105 = parseFloat((numValue * 0.105).toFixed(2));
        if (name === 'netoGravado21') newForm.iva21 = parseFloat((numValue * 0.21).toFixed(2));
        if (name === 'netoGravado27') newForm.iva27 = parseFloat((numValue * 0.27).toFixed(2));

        // Regla: "El campo neto no Gravado total = valor de tasa neto 0%"
        if (name === 'netoGravado0') newForm.netoNoGravado = numValue;

        // B. Calcular Neto Gravado Total (Sumatoria de netos excepto tasa 0%)
        const n25 = parseFloat(String(newForm.netoGravado25)) || 0;
        const n5 = parseFloat(String(newForm.netoGravado5)) || 0;
        const n105 = parseFloat(String(newForm.netoGravado105)) || 0;
        const n21 = parseFloat(String(newForm.netoGravado21)) || 0;
        const n27 = parseFloat(String(newForm.netoGravado27)) || 0;

        newForm.montoGravadoTotal = parseFloat((n25 + n5 + n105 + n21 + n27).toFixed(2));

        // C. Calcular Total IVA (Sumatoria de IVAs)
        const i25 = parseFloat(String(newForm.iva25)) || 0;
        const i5 = parseFloat(String(newForm.iva5)) || 0;
        const i105 = parseFloat(String(newForm.iva105)) || 0;
        const i21 = parseFloat(String(newForm.iva21)) || 0;
        const i27 = parseFloat(String(newForm.iva27)) || 0;

        newForm.totalIva = parseFloat((i25 + i5 + i105 + i21 + i27).toFixed(2));

        // D. Calcular Gran Total
        const noGrav = parseFloat(String(newForm.netoNoGravado)) || 0;
        const exentas = parseFloat(String(newForm.operacionesExentas)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;

        const granTotal = newForm.montoGravadoTotal + noGrav + exentas + newForm.totalIva + otros;
        newForm.total = parseFloat(granTotal.toFixed(2));

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
                    
                    {/* Alícuotas e Importes */}
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

                    {/* Otros Conceptos y Totales */}
                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid var(--border-color)', margin: '8px 0', paddingBottom: '4px', fontWeight: 'bold', color: 'var(--primary-color)' }}>Otros Conceptos y Totales</div>

                    <Input label="Neto 0%" name="netoGravado0" type="number" value={formData.netoGravado0 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado0} title="Al modificarlo, se igualará automáticamente al Neto No Gravado" />
                    <Input label="Neto No Gravado" name="netoNoGravado" type="number" value={formData.netoNoGravado || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoNoGravado} />
                    <Input label="Op. Exentas" name="operacionesExentas" type="number" value={formData.operacionesExentas || ''} onChange={handleAmountChange} readOnly={readOnlyFields.operacionesExentas} />
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} readOnly={readOnlyFields.otrosTributos} />

                    <Input label="Neto Gravado Total" name="montoGravadoTotal" type="number" value={formData.montoGravadoTotal || ''} readOnly style={{ backgroundColor: 'var(--background-color)' }} />
                    <Input label="Total IVA" name="totalIva" type="number" value={formData.totalIva || ''} readOnly style={{ backgroundColor: 'var(--background-color)' }} />
                    <div style={{ gridColumn: '1 / -1' }}>
                        <Input label="Total" name="total" type="number" value={formData.total || ''} readOnly style={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: 'var(--background-color)', color: 'var(--primary-color)' }} />
                    </div>
                </div>
            </form>
        </Modal>
    );
};