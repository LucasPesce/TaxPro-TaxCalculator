import React, { useState, useEffect } from 'react';
import { type PurchaseInvoice } from '../../../../../src/types';
import { Modal } from '../../../../../src/components/ui/Modal/Modal';
import { Button } from '../../../../../src/components/ui/Button/Button';
import { Input } from '../../../../../src/components/ui/Input/Input';
// Reutilizamos estilos del modal de ventas o creamos uno nuevo simple inline para no complicar ahora
import styles from './EditPurchaseModal.module.css';

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

    // Cuando cambia la factura seleccionada (o se abre para crear), reseteamos el form
    useEffect(() => {
        if (invoice) {
            setFormData({ ...invoice });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                    <Input label="Tipo Comp." name="doc" value={formData.doc} onChange={handleChange} />
                    <Input label="Número" name="nro" value={formData.nro} onChange={handleChange} />
                    <Input label="Clasificación" name="clasificacion" value={formData.clasificacion} onChange={handleChange} />
                    
                    {/* Importes */}
                    <Input label="Gravado" name="montoGravado" type="number" value={formData.montoGravado} onChange={handleChange} />
                    <Input label="Exento" name="exento" type="number" value={formData.exento} onChange={handleChange} />
                    <Input label="IVA 21%" name="iva21" type="number" value={formData.iva21} onChange={handleChange} />
                    <Input label="IVA 27%" name="iva27" type="number" value={formData.iva27} onChange={handleChange} />
                    <Input label="IVA 10.5%" name="iva105" type="number" value={formData.iva105} onChange={handleChange} />
                    
                    {/* Percepciones */}
                    <Input label="Perc. IIBB" name="percIIBB" type="number" value={formData.percIIBB} onChange={handleChange} />
                    <Input label="Perc. IVA" name="percIva" type="number" value={formData.percIva} onChange={handleChange} />
                    <Input label="Perc. Mun" name="percMun" type="number" value={formData.percMun} onChange={handleChange} />
                    
                    <Input label="Total" name="total" type="number" style={{fontWeight:'bold'}} value={formData.total} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};