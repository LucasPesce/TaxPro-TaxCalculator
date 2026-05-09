import React, { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import styles from './CompanyModal.module.css';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (cuit: string, nombre: string) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [cuit, setCuit] = useState('');
    const [nombre, setNombre] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cuit && nombre) {
            onSubmit(cuit, nombre);
            // Limpiamos los campos para la próxima vez
            setCuit('');
            setNombre('');
        } else {
            alert("Por favor complete todos los campos");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Datos de la Empresa"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit}>Continuar Importación</Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className={styles.formGrid}>
                <p className={styles.helperText}>
                    Para asociar las facturas correctamente, ingrese los datos de la empresa emisora de este archivo.
                </p>
                
                <Input 
                    label="CUIT de la Empresa" 
                    placeholder="Ej: 30123456789"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    type="number"
                />
                
                <Input 
                    label="Razón Social / Nombre" 
                    placeholder="Ej: Mi Empresa S.A."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                />
            </form>
        </Modal>
    );
};