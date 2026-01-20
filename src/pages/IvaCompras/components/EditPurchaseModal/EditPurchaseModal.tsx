import React, { useState, useEffect } from 'react';
import { type PurchaseInvoice } from '../../../../../src/types';
import { Modal } from '../../../../../src/components/ui/Modal/Modal';
import { Button } from '../../../../../src/components/ui/Button/Button';
import { Input } from '../../../../../src/components/ui/Input/Input';
import { Select } from '../../../../../src/components/ui/Select/Select';
// Reutilizamos estilos del modal de ventas o creamos uno nuevo simple inline para no complicar ahora
import styles from './EditPurchaseModal.module.css';

// ================= CONSTANTES =================
const OPCIONES_COMPROBANTE = [
    "Factura A", "Factura B", "Factura C", "Factura M",
    "Nota de Débito A", "Nota de Débito B", "Nota de Débito C", "Nota de Débito M",
    "Nota de Crédito A", "Nota de Crédito B", "Nota de Crédito C", "Nota de Crédito M",
    "Ticket Factura A", "Ticket Factura B"
];

const OPCIONES_CLASIFICACION = [
    "Mercadería",
    "Servicios",
    "Bienes de Uso",
    "Locación",
    "Otros Gastos"
];

const TASAS_IVA = [
    { label: "21%", factor: 0.21, key: "iva21" },
    { label: "27%", factor: 0.27, key: "iva27" },
    { label: "10.5%", factor: 0.105, key: "iva105" }
];


// ================= TIPOS =================
interface EditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: PurchaseInvoice | null; // Si es null, es modo CREAR
    onSave: (invoice: PurchaseInvoice) => void;
    // Necesitamos estos datos para crear una nueva si no vienen en la factura
    defaultCuitEmpresa?: string;
    defaultNombreEmpresa?: string;
}

export const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({
    isOpen, onClose, invoice, onSave, defaultCuitEmpresa, defaultNombreEmpresa
}) => {
    const [formData, setFormData] = useState<Partial<PurchaseInvoice>>({});
    const [selectedIvaRate, setSelectedIvaRate] = useState<number>(0.21);
    // Cuando cambia la factura seleccionada (o se abre para crear), reseteamos el form

    // ================= EFECTOS =================
    useEffect(() => {
        if (invoice) {
            setFormData({ ...invoice });
            // Intentar deducir la tasa seleccionada basada en los montos existentes
            if (invoice.iva105 > 0) setSelectedIvaRate(0.105);
            else if (invoice.iva27 > 0) setSelectedIvaRate(0.27);
            else setSelectedIvaRate(0.21);
        } else {
            // Modo Crear: Limpiar campos
            setFormData({
                cuitEmpresa: defaultCuitEmpresa || '',
                nombreEmpresa: defaultNombreEmpresa || '',
                proveedor: '',
                cuitProveedor: '',
                condicionIva: 'Resp. Inscripto',
                doc: 'Factura A',
                nro: '',
                fechaEmision: '',
                fechaImputacion: '',
                provincia: '',
                jurisdiccion: '',
                clasificacion: 'Mercadería',
                montoGravado: 0, exento: 0, percIva: 0, percIIBB: 0, percMun: 0,
                ganancias: 0, iva27: 0, iva21: 0, iva105: 0, otrasRetenciones: 0, total: 0
            });
        }
    }, [invoice, isOpen, defaultCuitEmpresa, defaultNombreEmpresa]);

    // ================= LÓGICA DE CÁLCULO =================
    // Función central para calcular el total
    const calculateTotal = (data: Partial<PurchaseInvoice>) => {
        const sum = (
            (parseFloat(String(data.montoGravado)) || 0) +
            (parseFloat(String(data.exento)) || 0) +
            (parseFloat(String(data.iva21)) || 0) +
            (parseFloat(String(data.iva27)) || 0) +
            (parseFloat(String(data.iva105)) || 0) +
            (parseFloat(String(data.percIva)) || 0) +
            (parseFloat(String(data.percIIBB)) || 0) +
            (parseFloat(String(data.percMun)) || 0) +
            (parseFloat(String(data.otrasRetenciones)) || 0)
        );
        return parseFloat(sum.toFixed(2));
    };

    // Función para recalcular IVA basado en el gravado y la tasa actual
    const updateIvaAndTotal = (gravado: number, rate: number, currentForm: Partial<PurchaseInvoice>) => {
        const ivaAmount = parseFloat((gravado * rate).toFixed(2));

        const newForm = { ...currentForm, montoGravado: gravado };

        // Asignamos el IVA al campo correcto y limpiamos los otros para evitar inconsistencias
        // (Nota: Esto asume una factura con una sola alícuota, que es lo más común para editar simple)
        if (rate === 0.21) {
            newForm.iva21 = ivaAmount;
            newForm.iva105 = 0;
            newForm.iva27 = 0;
        } else if (rate === 0.105) {
            newForm.iva21 = 0;
            newForm.iva105 = ivaAmount;
            newForm.iva27 = 0;
        } else if (rate === 0.27) {
            newForm.iva21 = 0;
            newForm.iva105 = 0;
            newForm.iva27 = ivaAmount;
        }

        newForm.total = calculateTotal(newForm);
        setFormData(newForm);
    };

    // ================= MANEJADORES DE EVENTOS =================
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = parseFloat(value) || 0;

        const newForm = { ...formData, [name]: numValue };
        newForm.total = calculateTotal(newForm);
        setFormData(newForm);
    };

    const handleGravadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value) || 0;
        updateIvaAndTotal(val, selectedIvaRate, formData);
    };

    const handleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRate = parseFloat(e.target.value);
        setSelectedIvaRate(newRate);
        const currentGravado = parseFloat(String(formData.montoGravado)) || 0;
        updateIvaAndTotal(currentGravado, newRate, formData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí podrías validar tipos antes de enviar
        onSave(formData as PurchaseInvoice);
        onClose();
    };

    const getCurrentIvaValue = () => {
        if (selectedIvaRate === 0.21) return formData.iva21;
        if (selectedIvaRate === 0.105) return formData.iva105;
        if (selectedIvaRate === 0.27) return formData.iva27;
        return 0;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={invoice ? `Editar Factura: ${invoice.nro}` : "Nueva Factura de Compra"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
                </>
            }
        >
            <form className={styles.editForm}>
                <div className={styles.formGrid}>
                    {/* Datos del Comprobante */}
                    <Input label="Proveedor" name="proveedor" value={formData.proveedor} onChange={handleChange} />
                    <Input label="CUIT Prov." name="cuitProveedor" value={formData.cuitProveedor} onChange={handleChange} />
                    <Input label="Fecha Imput." name="fechaImputacion" type="date" value={formData.fechaImputacion} onChange={handleChange} />
                    <Select label="Tipo Comp." name="doc" value={formData.doc || 'Factura A'} onChange={handleChange}>
                        {OPCIONES_COMPROBANTE.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>                    <Input label="Número" name="nro" value={formData.nro} onChange={handleChange} />
                    <Select label="Clasificación" name="clasificacion" value={formData.clasificacion || 'Mercadería'} onChange={handleChange}>
                        {OPCIONES_CLASIFICACION.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                    {/* Importes */}
                    <hr style={{ gridColumn: '1 / -1', border: '0', borderTop: '1px solid #eee', width: '100%' }} />
                    <Input label="Gravado" name="montoGravado" type="number" value={formData.montoGravado} onChange={handleGravadoChange} />
                    <Input label="Exento" name="exento" type="number" value={formData.exento} onChange={handleChange} />
                    <Select label="Alícuota IVA" name="ivaRate" value={selectedIvaRate} onChange={handleRateChange}>
                        {TASAS_IVA.map(rate => (
                            <option key={rate.key} value={rate.factor}>{rate.label}</option>
                        ))}
                    </Select>
                    <Input
                        label={`IVA Calculado (${selectedIvaRate * 100}%)`} // El label cambia dinámicamente: "IVA Calculado (21%)"
                        name="ivaCalculado"
                        type="number"
                        value={getCurrentIvaValue() || ''}
                        readOnly // IMPORTANTE: El usuario no puede escribir aquí
                        style={{ backgroundColor: '#f9f9f9' }} // Visualmente se ve distinto
                    />
                    {/* Percepciones */}
                    <Input label="Perc. IIBB" name="percIIBB" type="number" value={formData.percIIBB} onChange={handleChange} />
                    <Input label="Perc. IVA" name="percIva" type="number" value={formData.percIva} onChange={handleChange} />
                    <Input label="Perc. Mun" name="percMun" type="number" value={formData.percMun} onChange={handleChange} />
                    <Input label="Otras Ret." name="otrasRetenciones" type="number" value={formData.otrasRetenciones || ''} onChange={handleAmountChange} />
                    
                    <Input
                        label="Total Comprobante"
                        name="total"
                        type="number"
                        value={formData.total || ''}
                        readOnly // Bloqueado
                        style={{
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            backgroundColor: '#e8f0fe',
                            borderColor: '#2196F3'
                        }}
                    />
                </div>
            </form>
        </Modal>
    );
};