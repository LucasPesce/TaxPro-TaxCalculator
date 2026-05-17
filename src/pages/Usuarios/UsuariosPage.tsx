import React, { useState } from 'react';
import { useUsuariosManager } from '../../hooks/useUsuariosManager';
import { EditUsuarioModal } from './components/EditUsuarioModal';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Agregamos faExclamationCircle para el cartel de aviso y quitamos faUserXmark
import { faPlus, faPencil, faTrash, faRotateLeft, faSort, faSortUp, faSortDown, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { type Usuario } from '../../types';

export const UsuariosPage: React.FC = () => {
    const { 
        usuarios, 
        sortConfig, 
        handleSort, 
        handleCreateUsuario, 
        handleUpdateUsuario, 
        handleDeleteUsuario, 
        handleRestoreUsuario, 
        handleForceDeleteUsuario 
    } = useUsuariosManager();
    
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

    const getSortIcon = (key: keyof Usuario) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    const sortableHeaderStyle: React.CSSProperties = {
        padding: '12px', 
        cursor: 'pointer', 
        userSelect: 'none',
        transition: 'background-color 0.2s'
    };

    // --- FUNCIÓN PARA CALCULAR DÍAS RESTANTES ---
    const getDiasRestantes = (fechaEliminacion: string | null | undefined) => {
        if (!fechaEliminacion) return 0;
        
        // 1. Convertimos la fecha de eliminación a objeto Date
        const fechaElim = new Date(fechaEliminacion);
        
        // 2. Le sumamos 30 días para saber la fecha límite
        const fechaLimite = new Date(fechaElim);
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        
        // 3. Calculamos la diferencia entre hoy y la fecha límite
        const hoy = new Date();
        const diffTiempo = fechaLimite.getTime() - hoy.getTime();
        
        // 4. Convertimos milisegundos a días (redondeando hacia arriba)
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
        
        return diffDias > 0 ? diffDias : 0;
    };

    // Filtramos solo los usuarios que están inhabilitados para mostrar el aviso
    const usuariosEnPapelera = usuarios.filter(u => !u.activo && u.fechaEliminacion);

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
                                <th style={sortableHeaderStyle} onClick={() => handleSort('documento')} title="Ordenar por Documento">
                                    Documento <FontAwesomeIcon icon={getSortIcon('documento')} style={{ marginLeft: '4px' }}/>
                                </th>
                                <th style={sortableHeaderStyle} onClick={() => handleSort('apellido')} title="Ordenar por Apellido">
                                    Apellido y Nombre <FontAwesomeIcon icon={getSortIcon('apellido')} style={{ marginLeft: '4px' }}/>
                                </th>
                                <th style={sortableHeaderStyle} onClick={() => handleSort('username')} title="Ordenar por Usuario">
                                    Usuario <FontAwesomeIcon icon={getSortIcon('username')} style={{ marginLeft: '4px' }}/>
                                </th>
                                <th style={sortableHeaderStyle} onClick={() => handleSort('rol')} title="Ordenar por Rol">
                                    Rol <FontAwesomeIcon icon={getSortIcon('rol')} style={{ marginLeft: '4px' }}/>
                                </th>
                                <th style={sortableHeaderStyle} onClick={() => handleSort('activo')} title="Ordenar por Estado">
                                    Estado <FontAwesomeIcon icon={getSortIcon('activo')} style={{ marginLeft: '4px' }}/>
                                </th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map(u => (
                                <tr key={u.id} style={{ 
                                    borderBottom: '1px solid var(--border-color)', 
                                    opacity: u.activo ? 1 : 0.6,
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '12px' }}>{u.documento}</td>
                                    <td style={{ padding: '12px' }}>{u.apellido}, {u.nombre}</td>
                                    <td style={{ padding: '12px' }}><strong>{u.username}</strong></td>
                                    <td style={{ padding: '12px' }}>{u.rol}</td>
                                    <td style={{ padding: '12px' }}>
                                        {/* APLICAMOS EL CAMBIO 1: Habilitado / Inhabilitado */}
                                        <StatusBadge status={u.activo ? 'Habilitado' : 'Inhabilitado'} /> 
                                    </td>
                                    <td style={{ padding: '12px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <Button variant="icon" onClick={() => openEditModal(u)} title="Editar Usuario">
                                            <FontAwesomeIcon icon={faPencil} />
                                        </Button>
                                        
                                        {u.activo ? (
                                            <Button variant="icon" onClick={() => handleDeleteUsuario(u.id)} title="Inhabilitar (Mover a papelera)">
                                                <FontAwesomeIcon icon={faTrash} color="#db0012" />
                                            </Button>
                                        ) : (
                                            <>
                                                <Button variant="icon" onClick={() => handleRestoreUsuario(u.id)} title="Restaurar Usuario">
                                                    <FontAwesomeIcon icon={faRotateLeft} color="#2196F3" />
                                                </Button>
                                                {/* APLICAMOS EL CAMBIO 3: Mismo ícono (faTrash) para el borrado definitivo */}
                                                <Button variant="icon" onClick={() => handleForceDeleteUsuario(u.id)} title="Eliminar Definitivamente">
                                                    <FontAwesomeIcon icon={faTrash} color="#db0012" />
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

            {/* --- APLICAMOS EL CAMBIO 2: CARTEL DE ADVERTENCIA DE ELIMINACIÓN --- */}
{usuariosEnPapelera.length > 0 && (
                <div style={{ 
                    marginTop: '8px', 
                    padding: '16px 20px', 
                    // El fondo ahora es una mezcla translúcida del color de acento
                    backgroundColor: 'color-mix(in srgb, var(--primary-color) 15%, transparent)',
                    // El borde y el color del texto usan directamente tu color de acento
                    border: '1px solid var(--primary-color)', 
                    borderRadius: '8px', 
                    color: 'var(--primary-color)', 
                    fontSize: '0.95rem'
                }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FontAwesomeIcon icon={faExclamationCircle} /> 
                        Aviso de Eliminación Programada
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {usuariosEnPapelera.map(u => (
                            <li key={u.id}>
                                El usuario <strong>{u.username}</strong> ({u.apellido}, {u.nombre}) será eliminado definitivamente del sistema en <strong>{getDiasRestantes(u.fechaEliminacion)} días</strong>.
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <EditUsuarioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                usuario={selectedUsuario}
                onSave={handleSave}
            />
        </div>
    );
};