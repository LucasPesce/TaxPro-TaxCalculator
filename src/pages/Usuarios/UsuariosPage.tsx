import React, { useState } from 'react';
import { useUsuariosManager } from '../../hooks/useUsuariosManager';
import { EditUsuarioModal } from './components/EditUsuarioModal';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type Usuario } from '../../types';
import { faPlus, faPencil, faTrash, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

export const UsuariosPage: React.FC = () => {
    const { usuarios, handleCreateUsuario, handleUpdateUsuario, handleDeleteUsuario, handleRestoreUsuario, handleForceDeleteUsuario } = useUsuariosManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

    const openCreateModal = () => {
        setSelectedUsuario(null);
        setIsModalOpen(true);
    };

    const openEditModal = (usuario: Usuario) => {
        setSelectedUsuario(usuario);
        setIsModalOpen(true);
    };

    const handleSave = (id: number | null, data: Partial<Usuario>) => {
        if (id) handleUpdateUsuario(id, data);
        else handleCreateUsuario(data);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-color)', margin: 0 }}>Gestión de Usuarios</h1>
                <Button variant="primary" onClick={openCreateModal}>
                    <FontAwesomeIcon icon={faPlus} /> Añadir Usuario
                </Button>
            </div>

            <Card title="Lista de Usuarios del Sistema">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                                <th style={{ padding: '12px' }}>Documento</th>
                                <th style={{ padding: '12px' }}>Apellido y Nombre</th>
                                <th style={{ padding: '12px' }}>Usuario</th>
                                <th style={{ padding: '12px' }}>Rol</th>
                                <th style={{ padding: '12px' }}>Estado</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: u.activo ? 1 : 0.6 }}>
                                    <td style={{ padding: '12px' }}>{u.documento}</td>
                                    <td style={{ padding: '12px' }}>{u.apellido}, {u.nombre}</td>
                                    <td style={{ padding: '12px' }}><strong>{u.username}</strong></td>
                                    <td style={{ padding: '12px' }}>{u.rol}</td>
                                    <td style={{ padding: '12px' }}>
                                        {/* Reutilizamos tu StatusBadge: Correcto = Verde, Error = Rojo */}
                                        <StatusBadge status={u.activo ? 'Correcto' : 'Error'} />
                                        {/* Tip: Podríamos crear un componente 'Badge' genérico luego, pero esto funciona perfecto */}
                                    </td>
                                    <td style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <Button variant="icon" onClick={() => openEditModal(u)} title="Editar Usuario">
                                            <FontAwesomeIcon icon={faPencil} />
                                        </Button>

                                        {u.activo ? (
                                            // Si ESTÁ ACTIVO: Mostramos el botón de enviar a la papelera (Soft Delete)
                                            <Button variant="icon" onClick={() => handleDeleteUsuario(u.id)} title="Inhabilitar (Mover a papelera)">
                                                <FontAwesomeIcon icon={faTrash}  />
                                            </Button>
                                        ) : (
                                            // Si NO ESTÁ ACTIVO (En papelera): Mostramos Restaurar y Borrado Definitivo
                                            <>
                                                <Button variant="icon" onClick={() => handleRestoreUsuario(u.id)} title="Restaurar Usuario">
                                                    <FontAwesomeIcon icon={faRotateLeft} color="#2196F3" />
                                                </Button>
                                                <Button variant="icon" onClick={() => handleForceDeleteUsuario(u.id)} title="Eliminar Definitivamente">
                                                    <FontAwesomeIcon icon={faTrash}  /> {/* Un rojo más oscuro */}
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted-color)' }}>
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <EditUsuarioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                usuario={selectedUsuario}
                onSave={handleSave}
            />
        </div>
    );
};