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

const PROVINCIAS_ARGENTINA = [
    "Buenos Aires",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Ciudad Autónoma de Buenos Aires (CABA)",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán"
];

export const EditClienteModal: React.FC<EditClienteModalProps> = ({ isOpen, onClose, cliente, onSave }) => {
    const [formData, setFormData] = useState<Partial<Cliente>>({});

    useEffect(() => {
        if (cliente) {
            setFormData({ ...cliente });
        } else {
            setFormData({ razonSocial: '', cuitEmpresa: '', cuitRepresentante: '', claveFiscal: '', domicilio: '', numero: '', telefono: '', email: '', jurisdiccion: '', condicionIva: 'Responsable Inscripto', idActividad: '', pyme: false });
        }
    }, [cliente, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData({ ...formData, [name]: val });
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
                    <Button variant="primary" type="submit" form="edit-cliente-form">Guardar</Button>
                </>
            }
        >
            <form
                id="edit-cliente-form"
                onSubmit={handleSubmit}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    minHeight: '500px'
                }}
            >
 <Input label="Razón Social" name="razonSocial" value={formData.razonSocial || ''} onChange={handleChange} required />
                <Input label="CUIT Empresa" name="cuitEmpresa" type="number" value={formData.cuitEmpresa || ''} onChange={handleChange} required />
                
                {/* FILA 2: SELECTORES AL INICIO (Garantiza el espacio de despliegue hacia abajo) */}
                <Select 
                    label="Jurisdicción (Provincia)" 
                    name="jurisdiccion" 
                    value={formData.jurisdiccion || ''} 
                    onChange={handleChange} 
                    required
                >
                    <option value="">Seleccione una provincia...</option>
                    {PROVINCIAS_ARGENTINA.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                    ))}
                </Select>
                <Select label="Condición IVA" name="condicionIva" value={formData.condicionIva || ''} onChange={handleChange}>
                    {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>

                {/* FILA 3 */}
                <Input label="CUIT Representante" name="cuitRepresentante" type="number" value={formData.cuitRepresentante || ''} onChange={handleChange} required />
                <Input 
                    label="Clave Fiscal" 
                    name="claveFiscal" 
                    type="text" 
                    value={formData.claveFiscal || ''} 
                    onChange={handleChange} 
                    required
                />

                {/* FILA 4 */}
                <Input label="Calle/Barrio" name="domicilio" value={formData.domicilio || ''} onChange={handleChange} required />
                <Input label="Número (o Piso/Dpto)" name="numero" value={formData.numero || ''} onChange={handleChange} required />
                
                {/* FILA 5 */}
                <Input label="Teléfono" name="telefono" type="number" value={formData.telefono || ''} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />

                {/* FILA 6 */}
                <Input label="ID Actividad" name="idActividad" value={formData.idActividad || ''} onChange={handleChange} required />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', marginTop: '24px' }}>
                    <input 
                        type="checkbox" 
                        id="pyme" 
                        name="pyme" 
                        checked={!!formData.pyme} 
                        onChange={handleChange} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="pyme" style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-muted-color)', cursor: 'pointer' }}>
                        ¿Es empresa PyME?
                    </label>
                </div>
            </form>
        </Modal>
    );
};