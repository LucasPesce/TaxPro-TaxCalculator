// src/pages/Auditoria/AuditoriaPage.tsx
import React from 'react';
import { useAuditoriaManager } from './hooks/useAuditoriaManager';
import { AuditoriaFilters } from './components/AuditoriaFilters';
import { Card } from '../../components/ui/Card/Card';
import { Pagination } from '../../components/ui/Pagination/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

export const AuditoriaPage: React.FC = () => {
    const { 
        registros, totalRegistros, loading, sortConfig, 
        currentPage, ITEMS_PER_PAGE, 
        setCurrentPage, handleSort, fetchAuditoria 
    } = useAuditoriaManager();

    const formatearFecha = (fechaISO: string) => {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    // Función auxiliar para el ícono de ordenamiento
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    // Estilo para el encabezado ordenable
    const sortableHeaderStyle: React.CSSProperties = {
        padding: '12px', 
        cursor: 'pointer', 
        userSelect: 'none',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-color)', margin: 0 }}>Registro de Actividad</h1>

            {/* Filtros */}
            <AuditoriaFilters onSearch={fetchAuditoria} />

            {/* Tabla de Resultados */}
            <Card title={`Historial de Auditoría (${totalRegistros} registros encontrados)`}>
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted-color)' }}>Cargando registros...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: 'var(--background-color)' }}>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted-color)' }}>
                                    <th style={sortableHeaderStyle} onClick={() => handleSort('fechaHora')}>
                                        Fecha y Hora <FontAwesomeIcon icon={getSortIcon('fechaHora')} style={{ marginLeft: '4px' }}/>
                                    </th>
                                    <th style={sortableHeaderStyle} onClick={() => handleSort('operadorNombre')}>
                                        Operador <FontAwesomeIcon icon={getSortIcon('operadorNombre')} style={{ marginLeft: '4px' }}/>
                                    </th>
                                    <th style={sortableHeaderStyle} onClick={() => handleSort('accion')}>
                                        Operación <FontAwesomeIcon icon={getSortIcon('accion')} style={{ marginLeft: '4px' }}/>
                                    </th>
                                    <th style={sortableHeaderStyle} onClick={() => handleSort('entidadAfectada')}>
                                        Módulo Afectado <FontAwesomeIcon icon={getSortIcon('entidadAfectada')} style={{ marginLeft: '4px' }}/>
                                    </th>
                                    <th style={{ padding: '12px' }}>Detalles</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registros.map(reg => {
                                    // Evaluamos si es una operación crítica (Borrado/Inhabilitación) para darle color de acento
                                    const esCritico = reg.accion.includes('ELIMINACIÓN') || reg.accion.includes('INHABILITACIÓN');
                                    
                                    return (
                                        <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{formatearFecha(reg.fechaHora)}</td>
                                            <td style={{ padding: '12px' }}>
                                                <strong>{reg.operadorNombre}</strong><br/>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-color)' }}>DNI: {reg.operadorDoc}</span>
                                            </td>
                                            <td style={{ 
                                                padding: '12px', 
                                                fontWeight: '600',                                               
                                            }}>
                                                {reg.accion}
                                            </td>
                                            <td style={{ padding: '12px' }}>{reg.entidadAfectada}</td>
                                            <td style={{ padding: '12px' }}>{reg.detalles}</td>
                                        </tr>
                                    );
                                })}
                                {registros.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted-color)' }}>
                                            No se encontraron registros para los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Paginación */}
            <Pagination
                currentPage={currentPage}
                totalItems={totalRegistros}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};