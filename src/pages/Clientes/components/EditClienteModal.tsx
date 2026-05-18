import React, { useState, useEffect } from 'react';
import { type Cliente } from '../../../types';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';

interface EditClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    onSave: (id: number | null, data: Partial<Cliente>) => void;
}

const CONDICIONES_IVA = ["Responsable Inscripto", "Monotributista", "Exento", "Consumidor Final"];

export const EditClienteModal: React.FC<EditClienteModalProps> = ({ isOpen, onClose, cliente, onSave }) => {
    const [formData, setFormData] = useState<Partial<Cliente>>({});

    useEffect(() => {
        if (cliente) {
            setFormData({ ...cliente });
        } else {
            setFormData({ razonSocial: '', cuitEmpresa: '', cuitRepresentante: '', claveFiscal: '', domicilio: '', numero: '', telefono: '', email: '', jurisdiccion: '', condicionIva: 'Responsable Inscripto', idActividad: '' });
        }
    }, [cliente, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(cliente ? cliente.id : null, formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={cliente ? `Editar Cliente: ${cliente.razonSocial}` : "Nuevo Cliente"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
                </>
            }
        >
            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Razón Social" name="razonSocial" value={formData.razonSocial || ''} onChange={handleChange} required />
                <Input label="CUIT Empresa" name="cuitEmpresa" type="number" value={formData.cuitEmpresa || ''} onChange={handleChange} required />

                <Input label="CUIT Representante" name="cuitRepresentante" type="number" value={formData.cuitRepresentante || ''} onChange={handleChange} required />
                <Input
                    label="Clave Fiscal"
                    name="claveFiscal"
                    type="text"
                    value={formData.claveFiscal || ''}
                    onChange={handleChange}
                    placeholder={cliente ? "•••••••• (Vacío = No cambiar)" : "Requerida"}
                    required={!cliente}
                />

                <Input label="Domicilio" name="domicilio" value={formData.domicilio || ''} onChange={handleChange} required />
                <Input label="Número (o Piso/Dpto)" name="numero" value={formData.numero || ''} onChange={handleChange} required />

                <Input label="Jurisdicción (Provincia)" name="jurisdiccion" value={formData.jurisdiccion || ''} onChange={handleChange} required />

                <Input label="Teléfono" name="telefono" type="number" value={formData.telefono || ''} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />

                <Select label="Condición IVA" name="condicionIva" value={formData.condicionIva || ''} onChange={handleChange}>
                    {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Input label="ID Actividad" name="idActividad" value={formData.idActividad || ''} onChange={handleChange} required />
            </form>
        </Modal>
    );
};