import React, { useState } from 'react';
import { useClientesManager } from '../../hooks/useClientesManager';
import { EditClienteModal } from './components/EditClienteModal';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencil, faTrash, faRotateLeft, faSort, faSortUp, faSortDown, } from '@fortawesome/free-solid-svg-icons';
import { type Cliente } from '../../types';

export const ClientesPage: React.FC = () => {
    const {
        clientes,
        totalClientes,
        currentPage,
        ITEMS_PER_PAGE,
        setCurrentPage,
        sortConfig,
        handleSort,
        handleCreateCliente,
        handleUpdateCliente,
        handleDeleteCliente,
        handleRestoreCliente,
    } = useClientesManager();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

    const handleSave = (id: number | null, data: Partial<Cliente>) => {
        if (id) handleUpdateCliente(id, data);
        else handleCreateCliente(data);
    };

    const getSortIcon = (key: keyof Cliente) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    const headerStyle: React.CSSProperties = { padding: '10px 12px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

    const getDiasRestantes = (fechaEliminacion: string | null | undefined) => {
        if (!fechaEliminacion) return 0;
        const fechaElim = new Date(fechaEliminacion);
        const fechaLimite = new Date(fechaElim);
        fechaLimite.setDate(fechaLimite.getDate() + 30);
        const hoy = new Date();
        const diffTiempo = fechaLimite.getTime() - hoy.getTime();
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
        return diffDias > 0 ? diffDias : 0;
    };

    const clientesEnPapelera = clientes.filter(c => !c.activo && c.fechaEliminacion);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', color: 'var(--text-color)', margin: 0 }}>Cartera de Clientes</h1>
                <Button variant="primary" onClick={() => { setSelectedCliente(null); setIsModalOpen(true); }}>
                    <FontAwesomeIcon icon={faPlus} /> Añadir Cliente
                </Button>
            </div>

            <Card title="Directorio de Clientes">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                                <th style={headerStyle} onClick={() => handleSort('cuitEmpresa')}>CUIT <FontAwesomeIcon icon={getSortIcon('cuitEmpresa')} /></th>
                                <th style={headerStyle} onClick={() => handleSort('razonSocial')}>Razón Social <FontAwesomeIcon icon={getSortIcon('razonSocial')} /></th>
                                <th style={headerStyle}>CUIT Rep.</th>
                                <th style={headerStyle}>Clave Fiscal</th>
                                <th style={headerStyle}>Calle</th>
                                <th style={headerStyle}>Número</th>
                                <th style={headerStyle}>Teléfono</th>
                                <th style={headerStyle}>Email</th>
                                <th style={headerStyle}>Jurisdicción</th>
                                <th style={headerStyle}>Cond. IVA</th>
                                <th style={headerStyle} onClick={() => handleSort('pyme')}>PyME <FontAwesomeIcon icon={getSortIcon('pyme')} /></th>
                                <th style={headerStyle}>Actividad</th>
                                <th style={headerStyle} onClick={() => handleSort('activo')}>Estado <FontAwesomeIcon icon={getSortIcon('activo')} /></th>
                                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: c.activo ? 1 : 0.6 }}>
                                    <td style={{ padding: '10px 12px' }}>{c.cuitEmpresa}</td>
                                    <td style={{ padding: '10px 12px' }}><strong>{c.razonSocial}</strong></td>
                                    <td style={{ padding: '10px 12px' }}>{c.cuitRepresentante}</td>
                                    <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{c.claveFiscal}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.domicilio}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.numero}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.telefono}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.email}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.jurisdiccion}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.condicionIva}</td>
                                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: c.pyme ? '#2196F3' : 'inherit' }}> {c.pyme ? 'Sí' : 'No'}</td>
                                    <td style={{ padding: '10px 12px' }}>{c.idActividad}</td>

                                    <td style={{ padding: '10px 12px' }}><StatusBadge status={c.activo ? 'Habilitado' : 'Inhabilitado'} /></td>
                                    <td style={{ padding: '10px 12px', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                        <Button variant="icon" onClick={() => { setSelectedCliente(c); setIsModalOpen(true); }}><FontAwesomeIcon icon={faPencil} /></Button>
                                        {c.activo ? (
                                            <Button variant="icon" onClick={() => handleDeleteCliente(c.id)}><FontAwesomeIcon icon={faTrash} color="#db0012" /></Button>
                                        ) : (
                                            <>
                                                <Button variant="icon" onClick={() => handleRestoreCliente(c.id)}><FontAwesomeIcon icon={faRotateLeft} color="#2196F3" /></Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* --- COMPONENTE DE PAGINACIÓN --- */}
            <Pagination
                currentPage={currentPage}
                totalItems={totalClientes}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />

            <EditClienteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} cliente={selectedCliente} onSave={handleSave} />
        </div>
    );
};