//================= IMPORTACIONES ===================
import React, { useState, useEffect } from 'react';
import { type Invoice } from '../../../../types';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import styles from './EditInvoiceModal.module.css';
import { Select } from '../../../../components/ui/Select/Select';

//================= CONSTANTES ===================
const OPCIONES_CONDICION_IVA = [
    "Consumidor Final",
    "Responsable Inscripto",
    "Sujeto Exento",
    "Sujeto No Alcanzado",
    "Monotributista"
];

const OPCIONES_COMPROBANTE = [
    "Factura A", "Factura B", "Factura C", "Factura E",
    "Nota de Credito A", "Nota de Credito B", "Nota de Credito C",
    "Nota de Debito A", "Nota de Debito B", "Nota de Debito C"
];

const OPCIONES_PROVINCIA = [
    "Buenos Aires", "Catamarca", "Ciudad Autónoma de Buenos Aires",
    "Chaco","Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
    "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
    "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
    "Tierra del Fuego", "Tucumán"
];

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

    const [readOnlyFields, setReadOnlyFields] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (invoice) {
            const isIvaError = invoice.controlIva === 'Error';
            const isCompletenessError = invoice.correlatividad === 'Error';

            // Por defecto, bloqueamos todo
            const fieldsToLock: Record<string, boolean> = {
                cliente: true, condIva: true, doc: true, fecha: true,
                montoGravado: true, iva21: true, percIIBB: true, percMun: true,
                provincia: true, docNumero: true
            };

            // 1. Si es error de IVA, desbloqueamos los campos de cálculo
            if (isIvaError) {
                fieldsToLock.montoGravado = false;
                fieldsToLock.iva21 = false; // El IVA es calculado, pero lo desbloqueamos por si el usuario necesita ajustarlo manualmente
                fieldsToLock.percIIBB = false;
                fieldsToLock.percMun = false;
            }

            // 2. SI ES UNA FACTURA FALTANTE, DESBLOQUEAMOS LOS CAMPOS PARA COMPLETAR
            if (isCompletenessError) {
                fieldsToLock.cliente = false;
                fieldsToLock.condIva = false;
                fieldsToLock.doc = false;
                fieldsToLock.docNumero = false;
                fieldsToLock.fecha = false;
                fieldsToLock.provincia = false;

                // También los montos, ya que una factura faltante los tiene en 0
                fieldsToLock.montoGravado = false;
                fieldsToLock.iva21 = false;
                fieldsToLock.percIIBB = false;
                fieldsToLock.percMun = false;
            }

            setReadOnlyFields(fieldsToLock);
        }

        if (!invoice) return;

        const stringifiedInvoice = Object.fromEntries(
            Object.entries(invoice).map(([key, value]) => [key, String(value)])
        ) as FormState;

        // Convertir fecha para el input type="date"
        if (invoice.fecha && invoice.fecha.includes('/')) {
            const [day, month, year] = invoice.fecha.split('/');
            stringifiedInvoice.fecha = `${year}-${month}-${day}`;
        }

        setFormData(stringifiedInvoice);

    }, [invoice]);


    //================= MANEJADORES DE EVENTOS ===================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Actualizamos el campo que el usuario está editando
        const updatedFormData = { ...formData, [name]: value };

        // 1. RECALCULAR IVA SI CAMBIA EL MONTO GRAVADO
        // Usamos 'name' para saber qué campo se está modificando
        if (name === 'montoGravado') {
            const gravado = parseFloat(value) || 0;
            const ivaCalculado = gravado * 0.21;
            updatedFormData.iva21 = ivaCalculado.toFixed(2); // Guardamos como string con 2 decimales
        }

        // 2. RECALCULAR EL TOTAL SIEMPRE QUE CAMBIE CUALQUIER MONTO
        // Convertimos todos los valores relevantes a número para sumar
        const gravado = parseFloat(updatedFormData.montoGravado || '0') || 0;
        const iva = parseFloat(updatedFormData.iva21 || '0') || 0;
        const iibb = parseFloat(updatedFormData.percIIBB || '0') || 0;
        const mun = parseFloat(updatedFormData.percMun || '0') || 0;

        const totalCalculado = gravado + iva + iibb + mun;
        updatedFormData.total = totalCalculado.toFixed(2); // Actualizamos el total

        // 3. Actualizamos el estado con todos los cambios
        setFormData(updatedFormData);
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

            let fechaParaGuardar = formData.fecha || '';
            if (fechaParaGuardar && fechaParaGuardar.includes('-')) {
                const [year, month, day] = fechaParaGuardar.split('-');
                fechaParaGuardar = `${day}/${month}/${year}`;
            }

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
                    <Input label="Cliente" name="cliente" type="text" value={formData.cliente || ''} onChange={handleChange} readOnly={readOnlyFields.cliente} />
                    <Select label="Cond. IVA" name="condIva" value={formData.condIva || ''} onChange={handleChange} readOnly={readOnlyFields.condIva}>
                        {OPCIONES_CONDICION_IVA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    <Select label="Comprobante" name="doc" value={formData.doc || ''} onChange={handleChange} readOnly={readOnlyFields.doc}>
                        {OPCIONES_COMPROBANTE.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    <Input label="Fecha" name="fecha" type="date" value={formData.fecha || ''} onChange={handleChange} readOnly={readOnlyFields.fecha} />
                    <Input label="Nro. Comprobante" name="nro" type="text" value={formData.nro || ''} readOnly />
                    <Input label="Monto Gravado" name="montoGravado" type="number" value={formData.montoGravado || ''} onChange={handleChange} readOnly={readOnlyFields.montoGravado} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21 || ''} onChange={handleChange} readOnly={readOnlyFields.iva21} />
                    <Input label="Ingresos Brutos" name="percIIBB" type="number" value={formData.percIIBB || ''} onChange={handleChange} readOnly={readOnlyFields.percIIBB} />
                    <Input label="Taza Municipal" name="percMun" type="number" value={formData.percMun || ''} onChange={handleChange} readOnly={readOnlyFields.percMun} />
                    <Select label="Provincia" name="provincia" value={formData.provincia || ''} onChange={handleChange} readOnly={readOnlyFields.provincia}>
                        <option value="">Seleccionar...</option>
                        {OPCIONES_PROVINCIA.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    <Input label="Total" name="total" type="number" value={formData.total || ''} onChange={handleChange} readOnly />
                </div>
            </form>
        </Modal>
    );
};