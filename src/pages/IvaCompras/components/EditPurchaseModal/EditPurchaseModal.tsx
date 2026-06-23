import React, { useState, useEffect } from 'react';
import { type PurchaseInvoice } from '../../../../../src/types';
import { Modal } from '../../../../../src/components/ui/Modal/Modal';
import { Button } from '../../../../../src/components/ui/Button/Button';
import { Input } from '../../../../../src/components/ui/Input/Input';

import styles from './EditPurchaseModal.module.css';

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

    // ================= EFECTOS =================
    useEffect(() => {
        if (invoice) {
            setFormData({ ...invoice });
        } else {
            setFormData({
                cuitEmpresa: defaultCuitEmpresa || '',
                nombreEmpresa: defaultNombreEmpresa || '',
                proveedor: '',
                cuitProveedor: '',
                tipoComprobante: 'Factura A',
                numeroFactura: '',
                numeroDesde: '',
                numeroHasta: '',
                puntoVenta: '',
                codAutorizacion: '',
                tipoDocEmisor: '80',
                fechaEmision: '',
                fechaImputacion: '',
                provincia: 'Córdoba',
                jurisdiccion: 'Córdoba',
                montoGravado: 0,
                netoNoGravado: 0,
                exento: 0,
                otrosTributos: 0,
                iva: 0,
                total: 0
            });
        }
    }, [invoice, isOpen, defaultCuitEmpresa, defaultNombreEmpresa]);

    // ================= LÓGICA DE CÁLCULO =================
    // Función central para calcular el total
    const calculateTotal = (data: Partial<PurchaseInvoice>) => {
        const sum = (
            (parseFloat(String(data.montoGravado)) || 0) +
            (parseFloat(String(data.exento)) || 0) +
            (parseFloat(String(data.netoNoGravado)) || 0) +
            (parseFloat(String(data.otrosTributos)) || 0) +
            (parseFloat(String(data.iva)) || 0)
        );
        return parseFloat(sum.toFixed(2));
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

        // Autocalcular el total de compras: Gravado + Exento + No Gravado + Otros Tributos + IVA
        const gravado = parseFloat(String(newForm.montoGravado)) || 0;
        const exento = parseFloat(String(newForm.exento)) || 0;
        const noGravado = parseFloat(String(newForm.netoNoGravado)) || 0;
        const otros = parseFloat(String(newForm.otrosTributos)) || 0;
        const iva = parseFloat(String(newForm.iva)) || 0;

        newForm.total = gravado + exento + noGravado + otros + iva;
        setFormData(newForm);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí podrías validar tipos antes de enviar
        onSave(formData as PurchaseInvoice);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={invoice ? `Editar Factura: ${invoice.numeroFactura}` : "Nueva Factura de Compra"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className={styles.editForm}>
                <div className={styles.formGrid}>
                    {/* --- DATOS DE ENCABEZADO --- */}
                    <Input label="Proveedor" name="proveedor" value={formData.proveedor || ''} onChange={handleChange} required />
                    <Input label="CUIT Prov." name="cuitProveedor" type="number" value={formData.cuitProveedor || ''} onChange={handleChange} required />
                    <Input label="Tipo Comprobante" name="tipoComprobante" value={formData.tipoComprobante || ''} onChange={handleChange} required />
                    <Input label="Nro. Comprobante" name="numeroFactura" value={formData.numeroFactura || ''} onChange={handleChange} required placeholder="0001-00000001" />

                    <Input label="Fecha Emisión" name="fechaEmision" type="date" value={formData.fechaEmision || ''} onChange={handleChange} required />
                    <Input label="Fecha Imputación" name="fechaImputacion" type="date" value={formData.fechaImputacion || ''} onChange={handleChange} required />
                    <Input label="Cód. Autorización" name="codAutorizacion" value={formData.codAutorizacion || ''} onChange={handleChange} />

                    {/* --- CÁLCULOS --- */}
                    <hr style={{ gridColumn: '1 / -1', border: '0', borderTop: '1px solid #eee', width: '100%', margin: '8px 0' }} />

                    <Input label="Imp. Neto Gravado" name="montoGravado" type="number" value={formData.montoGravado || ''} onChange={handleAmountChange} required />
                    <Input label="Imp. Neto No Gravado" name="netoNoGravado" type="number" value={formData.netoNoGravado || ''} onChange={handleAmountChange} required />
                    <Input label="Imp. Op. Exentas" name="exento" type="number" value={formData.exento || ''} onChange={handleAmountChange} required />
                    <Input label="Otros Tributos" name="otrosTributos" type="number" value={formData.otrosTributos || ''} onChange={handleAmountChange} required />
                    <Input label="IVA (Total)" name="iva" type="number" value={formData.iva || ''} onChange={handleAmountChange} required />

                    <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                        <Input
                            label="Total Comprobante"
                            name="total"
                            type="number"
                            value={formData.total || ''}
                            readOnly
                            style={{ fontWeight: '800', fontSize: '1.1rem' }} // Heredará los colores nativos de tu tema
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
};