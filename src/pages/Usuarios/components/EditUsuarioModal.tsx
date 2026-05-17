import React, { useState, useEffect } from 'react';
import { type Usuario } from '../../../types';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';

interface EditUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    usuario: Usuario | null;
    onSave: (id: number | null, data: Partial<Usuario>) => void;
}

const ROLES = [
    "Asistente Contable", 
    "Supervisor", 
    "Gerente", 
    "Administrador de Usuarios", 
    "Administrador General"
];

export const EditUsuarioModal: React.FC<EditUsuarioModalProps> = ({ isOpen, onClose, usuario, onSave }) => {
    const [formData, setFormData] = useState<Partial<Usuario>>({});

    useEffect(() => {
        if (usuario) {
            setFormData({ ...usuario, password: '' }); // Vaciamos la pass visualmente por seguridad
        } else {
            setFormData({ documento: '', nombre: '', apellido: '', username: '', rol: 'Asistente Contable', password: '' });
        }
    }, [usuario, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Si es nuevo, la pass es obligatoria. Si es edición, si está vacía no se envía.
        if (!usuario && !formData.password) {
            alert("La contraseña es obligatoria para nuevos usuarios.");
            return;
        }
        onSave(usuario ? usuario.id : null, formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={usuario ? `Editar Usuario: ${usuario.username}` : "Nuevo Usuario"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Guardar</Button>
                </>
            }
        >
            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Documento (DNI/Pasaporte)" name="documento" type="number" value={formData.documento || ''} onChange={handleChange} required />
                <Input label="Nombre" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                <Input label="Apellido" name="apellido" value={formData.apellido || ''} onChange={handleChange} required />
                <Input label="Nombre de Usuario" name="username" value={formData.username || ''} onChange={handleChange} required />

                <Select label="Rol de Permisos" name="rol" value={formData.rol || ''} onChange={handleChange}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>

                <Input
                    label={usuario ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    placeholder={usuario ? "••••••••" : "Ingrese contraseña"}
                />
            </form>
        </Modal>
    );
};