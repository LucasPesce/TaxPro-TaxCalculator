import React, { useState, useEffect } from 'react';
import { type Invoice } from '../../mock-data';
import './EditInvoiceModal.css';
import { Button } from '../../../../components/ui/Button/Button';

// 1. Definimos las props que el modal necesita para funcionar
interface EditInvoiceModalProps {
    isOpen: boolean;           // Para saber si debe mostrarse
    onClose: () => void;         // Función para cerrarse
    invoice: Invoice | null;   // Los datos de la factura a editar
}

export const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
    const [formData, setFormData] = useState<Partial<Invoice>>({});

    useEffect(() => {
        // Si recibimos una factura por props, actualizamos nuestro estado interno del formulario.
        if (invoice) {
            setFormData(invoice);
        }
    }, [invoice]); // La dependencia [invoice] asegura que esto solo se ejecute cuando se abre el modal con una nueva factura.

    // 4. Función genérica para actualizar el estado del formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value,
        }));
    };



    // Si el modal no está abierto, o no hay factura, no renderizamos nada.
    if (!isOpen || !invoice) {
        return null;
    }

    // Placeholder para la función de guardado
    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault(); // Evita que la página se recargue al enviar el formulario
        alert('Guardando cambios... (Lógica no implementada)');
        onClose(); // Cierra el modal después de "guardar"
    }

    return (
        // 2. El fondo oscuro semitransparente (overlay)
        <div className="modal-overlay" onClick={onClose}>
            {/* 3. El contenido del modal. Detenemos la propagación del click para que no se cierre al hacer clic adentro.*/}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Editar Registro de Factura</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </header>

                <form onSubmit={handleSaveChanges} className="edit-form">
                    <div className="form-grid">
                        <div className="form-field">
                            <label htmlFor="cliente">Cliente</label>
                            <input
                                id="cliente"
                                name="cliente" // 1. Añadimos el 'name'
                                type="text"
                                value={formData.cliente || ''} // 2. Usamos 'value' ligado al estado
                                onChange={handleChange} // 3. Conectamos el 'onChange'
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="condIva">Cond. IVA</label>
                            <input
                                id="condIva"
                                name="condIva"
                                type="text"
                                value={formData.condIva || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="doc">Documento</label>
                            <input id="doc" name="doc" type="text" value={formData.doc || ''} onChange={handleChange} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="fecha">Fecha</label>
                            <input id="fecha" name="fecha" type="text" value={formData.fecha || ''} onChange={handleChange} />
                        </div>

                        {/* El campo readonly solo necesita 'value', no 'onChange' */}
                        <div className="form-field form-field-readonly">
                            <label htmlFor="nro">Nro. Comprobante</label>
                            <input id="nro" name="nro" type="text" value={formData.nro || ''} readOnly />
                        </div>

                        <div className="form-field">
                            <label htmlFor="montoGravado">Monto Gravado</label>
                            <input id="montoGravado" name="montoGravado" type="number" value={formData.montoGravado || 0} onChange={handleChange} />
                        </div>

                        <div className="form-field">
                            <label htmlFor="iva21">IVA 21%</label>
                            <input id="iva21" name="iva21" type="number" value={formData.iva21 || 0} onChange={handleChange} />
                        </div>

                        <div className="form-field">
                            <label htmlFor="percIIBB">Perc. IIBB</label>
                            <input
                                id="percIIBB"
                                name="percIIBB"
                                type="number"
                                value={formData.percIIBB || 0}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="percMun">Perc. Municipal</label>
                            <input
                                id="percMun"
                                name="percMun"
                                type="number"
                                value={formData.percMun || 0}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="provincia">Provincia</label>
                            <input id="provincia" name="provincia" type="text" value={formData.provincia || ''} onChange={handleChange} />
                        </div>

                        <div className="form-field">
                            <label htmlFor="total">Total</label>
                            <input id="total" name="total" type="number" value={formData.total || 0} onChange={handleChange} />
                        </div>
                        {/* ... Añade aquí los campos que se necesites ... */}
                    </div>

                    <footer className="modal-footer">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            Guardar Cambios
                        </Button>
                    </footer>
                </form>
            </div>
        </div>
    );
};