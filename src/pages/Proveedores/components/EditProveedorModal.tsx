// src/pages/Proveedores/components/EditProveedorModal.tsx
import React, { useState, useEffect } from 'react';
import { type Proveedor } from '../../../types';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';

interface EditProveedorModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
    onSave: (id: number | null, data: Partial<Proveedor>) => void;
}

const CONDICIONES_IVA = ["Responsable Inscripto", "Monotributista", "Exento", "Sujeto No Alcanzado"];

export const EditProveedorModal: React.FC<EditProveedorModalProps> = ({ isOpen, onClose, proveedor, onSave }) => {
    const [formData, setFormData] = useState<Partial<Proveedor>>({});

    useEffect(() => {
        if (proveedor) {
            setFormData({ ...proveedor });
        } else {
            setFormData({ 
                razonSocial: '', 
                cuitProveedor: '', 
                domicilio: '', 
                numero: '', 
                telefono: '', 
                email: '', 
                jurisdiccion: '', 
                condicionIva: 'Responsable Inscripto', 
                idActividad: '',
                idTipoCompra: '' // <--- NUEVO CAMPO
            });
        }
    }, [proveedor, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(proveedor ? proveedor.id : null, formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={proveedor ? `Editar Proveedor: ${proveedor.razonSocial}` : "Nuevo Proveedor"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
                </>
            }
        >
            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Razón Social" name="razonSocial" value={formData.razonSocial || ''} onChange={handleChange} required />
                <Input label="CUIT Proveedor" name="cuitProveedor" type="number" value={formData.cuitProveedor || ''} onChange={handleChange} required />
                
                {/* --- SECCIÓN DOMICILIO --- */}
                <Input label="Calle/Barrio" name="domicilio" value={formData.domicilio || ''} onChange={handleChange} required />
                <Input label="Número (o Piso/Dpto)" name="numero" value={formData.numero || ''} onChange={handleChange} required />
                
                <Input label="Jurisdicción (Provincia)" name="jurisdiccion" value={formData.jurisdiccion || ''} onChange={handleChange} required />
                <Input label="Teléfono" name="telefono" type="number" value={formData.telefono || ''} onChange={handleChange} required />
                
                <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
                <Select label="Condición IVA" name="condicionIva" value={formData.condicionIva || ''} onChange={handleChange}>
                    {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>

                <Input label="ID Actividad" name="idActividad" value={formData.idActividad || ''} onChange={handleChange} required />
                {/* 👇 AQUÍ ESTÁ EL INPUT NUEVO PARA COMPRAS 👇 */}
                <Input label="ID Tipo de Compra" name="idTipoCompra" value={formData.idTipoCompra || ''} onChange={handleChange} required />
            </form>
        </Modal>
    );
};