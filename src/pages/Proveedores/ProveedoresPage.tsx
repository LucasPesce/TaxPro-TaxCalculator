// src/pages/Proveedores/ProveedoresPage.tsx
import React, { useState } from 'react';
import { useProveedoresManager } from '../../hooks/useProveedoresManager';
import { EditProveedorModal } from './components/EditProveedorModal';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil, faTrash, faRotateLeft, faSort, faSortUp, faSortDown, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { type Proveedor } from '../../types';

export const ProveedoresPage: React.FC = () => {
    const { 
        proveedores, totalProveedores, currentPage, ITEMS_PER_PAGE, setCurrentPage, 
        sortConfig, handleSort, handleCreateProveedor, handleUpdateProveedor, 
        handleDeleteProveedor, handleRestoreProveedor 
    } = useProveedoresManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

    const handleSave = (id: number | null, data: Partial<Proveedor>) => {
        if (id) handleUpdateProveedor(id, data);
        else handleCreateProveedor(data);
    };

    const getSortIcon = (key: keyof Proveedor) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    const headerStyle: React.CSSProperties = { padding: '10px 12px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

    const getDiasRestantes = (fechaEliminacion: string | null | undefined) => {
        if (!fechaEliminacion) return 0;
        const fechaLimite = new Date(fechaEliminacion);
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        const diffTiempo = fechaLimite.getTime() - new Date().getTime();
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
        return diffDias > 0 ? diffDias : 0;
    };

    const proveedoresEnPapelera = proveedores.filter(p => !p.activo && p.fechaEliminacion);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-color)', margin: 0 }}>Directorio de Proveedores</h1>
                <Button variant="primary" onClick={() => { setSelectedProveedor(null); setIsModalOpen(true); }}>
                    <FontAwesomeIcon icon={faPlus} /> Añadir Proveedor
                </Button>
            </div>

            <Card title="Listado de Proveedores">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                                <th style={headerStyle} onClick={() => handleSort('cuitProveedor')}>CUIT <FontAwesomeIcon icon={getSortIcon('cuitProveedor')} /></th>
                                <th style={headerStyle} onClick={() => handleSort('razonSocial')}>Razón Social <FontAwesomeIcon icon={getSortIcon('razonSocial')} /></th>
                                <th style={headerStyle}>Calle</th>
                                <th style={headerStyle}>Número</th>
                                <th style={headerStyle}>Teléfono</th>
                                <th style={headerStyle}>Email</th>
                                <th style={headerStyle}>Jurisdicción</th>
                                <th style={headerStyle}>Cond. IVA</th>
                                <th style={headerStyle}>Actividad</th>
                                <th style={headerStyle}>Tipo Compra</th>
                                <th style={headerStyle} onClick={() => handleSort('activo')}>Estado <FontAwesomeIcon icon={getSortIcon('activo')} /></th>
                                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proveedores.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: p.activo ? 1 : 0.6 }}>
                                    <td style={{ padding: '10px 12px' }}>{p.cuitProveedor}</td>
                                    <td style={{ padding: '10px 12px' }}><strong>{p.razonSocial}</strong></td>
                                    <td style={{ padding: '10px 12px' }}>{p.domicilio}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.numero}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.telefono}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.email}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.jurisdiccion}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.condicionIva}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.idActividad}</td>
                                    <td style={{ padding: '10px 12px' }}>{p.idTipoCompra}</td>
                                    <td style={{ padding: '10px 12px' }}><StatusBadge status={p.activo ? 'Habilitado' : 'Inhabilitado'} /></td>
                                    <td style={{ padding: '10px 12px', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                        <Button variant="icon" onClick={() => { setSelectedProveedor(p); setIsModalOpen(true); }}><FontAwesomeIcon icon={faPencil} /></Button>
                                        {p.activo ? (
                                            <Button variant="icon" onClick={() => handleDeleteProveedor(p.id)}><FontAwesomeIcon icon={faTrash} color="#db0012" /></Button>
                                        ) : (
                                            <>
                                                <Button variant="icon" onClick={() => handleRestoreProveedor(p.id)}><FontAwesomeIcon icon={faRotateLeft} color="#2196F3" /></Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Pagination currentPage={currentPage} totalItems={totalProveedores} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />

            <EditProveedorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} proveedor={selectedProveedor} onSave={handleSave} />
        </div>
    );
};