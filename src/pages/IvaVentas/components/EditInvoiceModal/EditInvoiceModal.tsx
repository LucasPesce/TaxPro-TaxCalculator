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
            const isError = invoice.controlIva === 'Observado' || invoice.correlatividad === 'Observado';

            // 1. Por defecto todo bloqueado
            const fieldsToLock: Record<string, boolean> = {
                denominacionReceptor: true, nroDocReceptor: true, tipoComprobante: true, fecha: true,
                tipoCambio: true, moneda: true,
                netoGravado0: true, netoGravado25: true, netoGravado5: true, netoGravado105: true, netoGravado21: true, netoGravado27: true,
                netoNoGravado: true, operacionesExentas: true, otrosTributos: true
            };

            // 2. Si hay errores, liberamos SOLO los campos de ingreso manual (Los IVA siguen bloqueados siempre)
            if (isError) {
                fieldsToLock.denominacionReceptor = false;
                fieldsToLock.nroDocReceptor = false;
                fieldsToLock.tipoComprobante = false;
                fieldsToLock.fecha = false;
                fieldsToLock.tipoCambio = false;
                fieldsToLock.moneda = false;
                
                fieldsToLock.netoGravado0 = false;
                fieldsToLock.netoGravado25 = false;
                fieldsToLock.netoGravado5 = false;
                fieldsToLock.netoGravado105 = false;
                fieldsToLock.netoGravado21 = false;
                fieldsToLock.netoGravado27 = false;
                
                fieldsToLock.netoNoGravado = false;
                fieldsToLock.operacionesExentas = false;
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

        // A. Autocalcular IVA correspondiente estricto
        if (name === 'netoGravado25') newForm.iva25 = parseFloat((numValue * 0.025).toFixed(2));
        if (name === 'netoGravado5') newForm.iva5 = parseFloat((numValue * 0.05).toFixed(2));
        if (name === 'netoGravado105') newForm.iva105 = parseFloat((numValue * 0.105).toFixed(2));
        if (name === 'netoGravado21') newForm.iva21 = parseFloat((numValue * 0.21).toFixed(2));
        if (name === 'netoGravado27') newForm.iva27 = parseFloat((numValue * 0.27).toFixed(2));

        // B. Calcular Neto Gravado Total
        const n25 = parseFloat(String(newForm.netoGravado25)) || 0;
        const n5 = parseFloat(String(newForm.netoGravado5)) || 0;
        const n105 = parseFloat(String(newForm.netoGravado105)) || 0;
        const n21 = parseFloat(String(newForm.netoGravado21)) || 0;
        const n27 = parseFloat(String(newForm.netoGravado27)) || 0;
        newForm.montoGravadoTotal = parseFloat((n25 + n5 + n105 + n21 + n27).toFixed(2));

        // C. Calcular Total IVA
        const i25 = parseFloat(String(newForm.iva25)) || 0;
        const i5 = parseFloat(String(newForm.iva5)) || 0;
        const i105 = parseFloat(String(newForm.iva105)) || 0;
        const i21 = parseFloat(String(newForm.iva21)) || 0;
        const i27 = parseFloat(String(newForm.iva27)) || 0;
        newForm.totalIva = parseFloat((i25 + i5 + i105 + i21 + i27).toFixed(2));

        // D. Calcular Gran Total
        const n0 = parseFloat(String(newForm.netoGravado0)) || 0;
        const noGrav = parseFloat(String(newForm.netoNoGravado)) || 0;
        const exentas = parseFloat(String(newForm.operacionesExentas)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;

        const granTotal = newForm.montoGravadoTotal + n0 + noGrav + exentas + newForm.totalIva + otros;
        newForm.total = parseFloat(granTotal.toFixed(2));

        setFormData(newForm);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (invoice) {
            onSave({ ...invoice, ...formData, controlIva: 'Editado', correlatividad: 'Editado' } as Invoice);
        }
        onClose();
    };

    if (!invoice) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Factura: ${invoice.numeroFactura}`}
            footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={handleSubmit}>Guardar Cambios</Button></>}
        >
            
            <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.formGrid}>
                    {/* Fila 1: Cabecera */}
                    <Input label="Receptor Cliente" name="denominacionReceptor" value={formData.denominacionReceptor || ''} onChange={handleChange} readOnly={readOnlyFields.denominacionReceptor} />
                    <Input label="CUIT/DNI" name="nroDocReceptor" value={formData.nroDocReceptor || ''} onChange={handleChange} readOnly={readOnlyFields.nroDocReceptor} />
                    
                    {/* Fila 2 */}
                    <Input label="Fecha (DD/MM/YYYY)" name="fecha" value={formData.fecha || ''} onChange={handleChange} readOnly={readOnlyFields.fecha} />
                    <Input label="Comprobante" name="tipoComprobante" value={formData.tipoComprobante || ''} onChange={handleChange} readOnly={readOnlyFields.tipoComprobante} />
                    
                    {/* Fila 3 */}
                    <Input label="Tipo Cambio" name="tipoCambio" type="number" value={formData.tipoCambio || 1} onChange={handleChange} readOnly={readOnlyFields.tipoCambio} placeholder="Por defecto debe estar en 1. Editable" />
                    <Input label="Moneda" name="moneda" value={formData.moneda || '$'} onChange={handleChange} readOnly={readOnlyFields.moneda} placeholder="Por defecto debe estar en $. Editable" />

                    <div style={{ gridColumn: '1 / -1', height: '16px' }}></div>

                    {/* Fila 4: Neto 0% */}
                    <Input label="Imp. Neto Gravado IVA 0%" name="netoGravado0" type="number" value={formData.netoGravado0 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado0} />
                    <div></div>

                    {/* Fila 5: Neto 2.5% e IVA */}
                    <Input label="Imp. Neto Gravado IVA 2,5%" name="netoGravado25" type="number" value={formData.netoGravado25 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado25} />
                    <Input label="IVA 2,5%" name="iva25" type="number" value={formData.iva25 || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 6: Neto 5% e IVA */}
                    <Input label="Imp. Neto Gravado IVA 5%" name="netoGravado5" type="number" value={formData.netoGravado5 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado5} />
                    <Input label="IVA 5%" name="iva5" type="number" value={formData.iva5 || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 7: Neto 10.5% e IVA */}
                    <Input label="Imp. Neto Gravado IVA 10,5%" name="netoGravado105" type="number" value={formData.netoGravado105 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado105} />
                    <Input label="IVA 10,5%" name="iva105" type="number" value={formData.iva105 || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 8: Neto 21% e IVA */}
                    <Input label="Imp. Neto Gravado IVA 21%" name="netoGravado21" type="number" value={formData.netoGravado21 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado21} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 9: Neto 27% e IVA */}
                    <Input label="Imp. Neto Gravado IVA 27%" name="netoGravado27" type="number" value={formData.netoGravado27 || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoGravado27} />
                    <Input label="IVA 27%" name="iva27" type="number" value={formData.iva27 || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 10: No Gravado y Exentas */}
                    <Input label="Imp. Neto No Gravado" name="netoNoGravado" type="number" value={formData.netoNoGravado || ''} onChange={handleAmountChange} readOnly={readOnlyFields.netoNoGravado} />
                    <Input label="Imp. Op. Exentas" name="operacionesExentas" type="number" value={formData.operacionesExentas || ''} onChange={handleAmountChange} readOnly={readOnlyFields.operacionesExentas} />

                    {/* Fila 11: Otros Tributos */}
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} readOnly={readOnlyFields.otrosTributos} />
                    <div></div>

                    <div style={{ gridColumn: '1 / -1', height: '16px' }}></div>

                    {/* Fila 12: Totales Oficiales */}
                    <Input label="Imp. Neto Gravado Total" name="montoGravadoTotal" type="number" value={formData.montoGravadoTotal || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />
                    <Input label="Total IVA" name="totalIva" type="number" value={formData.totalIva || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', backgroundColor: 'var(--border-color)' }} />

                    {/* Fila 13: Gran Total */}
                    <Input label="Imp. Total" name="total" type="number" value={formData.total || ''} readOnly style={{ color: '#db0012', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: 'var(--border-color)' }} />
                    <div></div>
                </div>
            </form>
        </Modal>
    );
};
