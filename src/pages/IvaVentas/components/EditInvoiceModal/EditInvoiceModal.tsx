//================= IMPORTACIONES ===================
import React, { useState, useEffect } from 'react';
import { type Invoice } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import styles from './EditInvoiceModal.module.css';

//================= TIPOS Y PROPS ===================
interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: Invoice | null;
    onSave: (invoice: Invoice) => void;
}

// ======================= TIPO DE ESTADO DEL FORMULARIO =======================
type FormState = Partial<{ [K in keyof Invoice]: string }>;

//================= COMPONENTE PRINCIPAL: EditInvoiceModal ===================
export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoice, onSave }) => {

    //================= ESTADO Y EFECTOS ===================
    const [formData, setFormData] = useState<FormState>({});

    useEffect(() => {
        if (invoice) {
            const stringifiedInvoice = Object.fromEntries(
                Object.entries(invoice).map(([key, value]) => [key, String(value)])
            ) as FormState;
            setFormData(stringifiedInvoice);
        }
    }, [invoice]);


    //================= MANEJADORES DE EVENTOS ===================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (invoice) {
            const total = parseFloat(formData.total || '0') || 0;
            const percMun = parseFloat(formData.percMun || '0') || 0;
            const percIIBB = parseFloat(formData.percIIBB || '0') || 0;
            const montoGravado = parseFloat(formData.montoGravado || '0') || 0;
            const iva21 = parseFloat(formData.iva21 || '0') || 0;

            const docNumero = parseInt(formData.docNumero || '0', 10) || 0;

            const calculatedMontoGravado = (total - percMun - percIIBB) / 1.21;
            const difference = Math.abs(montoGravado - calculatedMontoGravado);
            const newIvaStatus: 'Correcto' | 'Error' = difference < 0.01 ? "Correcto" : "Error";

            let hasCompletenessError = false;

            const requiredFields: (keyof Invoice)[] = [
                'cliente',
                'condIva',
                'fecha',
                'doc',
                'nro',
                'provincia'
            ];
            for (const field of requiredFields) {
                // Si el campo no existe en formData o es un string vacío, es un error.
                if (!formData[field] || String(formData[field]).trim() === '') {
                    hasCompletenessError = true;
                    // Opcional: Muestra en consola qué campo falló para facilitar la depuración.
                    console.error(`Error de completitud: El campo '${field}' está vacío.`);
                    break; // Si ya encontramos un error, no hace falta seguir.
                }
            }
            if (!hasCompletenessError) {
                // Condición 1: El total de la factura no puede ser cero.
                if (total === 0) {
                    hasCompletenessError = true;
                    console.error("Error de completitud: El campo 'total' no puede ser cero.");
                }

                // Condición 2 (Excepción): Si es Responsable Inscripto, 'docNumero' es obligatorio.
                if (
                    formData.condIva === "Responsable Inscripto" &&
                    (!formData.docNumero || Number(formData.docNumero) === 0)
                ) {
                    hasCompletenessError = true;
                    console.error("Error de completitud: 'Responsable Inscripto' requiere un número de Documento.");
                }
            }

            const newCorrelatividadStatus: 'Correcto' | 'Error' = hasCompletenessError ? "Error" : "Correcto";

            const updatedInvoice = {
                id: invoice.id,
                nro: invoice.nro,
                cliente: formData.cliente || '',
                condIva: (formData.condIva as Invoice['condIva']) || 'Consumidor Final',
                doc: formData.doc || '',
                fecha: formData.fecha || '',
                provincia: formData.provincia || '',
                total,
                percMun,
                percIIBB,
                montoGravado,
                iva21,
                docNumero, // <-- PROPIEDAD AÑADIDA
                controlIva: newIvaStatus,
                correlatividad: newCorrelatividadStatus// Asignamos el nuevo estado de correlatividad
            };

            onSave(updatedInvoice);
        }
        onClose();
    };

    //================= RENDERIZADO DEL COMPONENTE ===================
    if (!invoice) {
        return null;
    }

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
                <div className={styles.formGrid}>
                    <Input label="Cliente" name="cliente" type="text" value={formData.cliente || ''} onChange={handleChange} />
                    <Input label="Cond. IVA" name="condIva" type="text" value={formData.condIva || ''} onChange={handleChange} />
                    <Input label="Documento" name="doc" type="text" value={formData.doc || ''} onChange={handleChange} />
                    <Input label="Fecha" name="fecha" type="text" value={formData.fecha || ''} onChange={handleChange} />
                    <Input label="Nro. Comprobante" name="nro" type="text" value={formData.nro || ''} readOnly />
                    <Input label="Monto Gravado" name="montoGravado" type="number" value={formData.montoGravado || ''} onChange={handleChange} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} onChange={handleChange} />
                    <Input label="Perc. IIBB" name="percIIBB" type="number" value={formData.percIIBB || ''} onChange={handleChange} />
                    <Input label="Perc. Municipal" name="percMun" type="number" value={formData.percMun || ''} onChange={handleChange} />
                    <Input label="Provincia" name="provincia" type="text" value={formData.provincia || ''} onChange={handleChange} />
                    <Input label="Total" name="total" type="number" value={formData.total || ''} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};