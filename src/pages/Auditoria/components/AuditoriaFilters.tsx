import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Button } from '../../../components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEraser } from '@fortawesome/free-solid-svg-icons';

interface AuditoriaFiltersProps {
    onSearch: (filtros: { fechaDesde: string; fechaHasta: string; operador: string; modulo: string }) => void;
}

export const AuditoriaFilters: React.FC<AuditoriaFiltersProps> = ({ onSearch }) => {
    const hoy = new Date().toISOString().split('T')[0];
    
    // 🚨 MEJORA 1: Rango de Fechas
    const [fechaDesde, setFechaDesde] = useState(hoy);
    const [fechaHasta, setFechaHasta] = useState(hoy);
    const [operador, setOperador] = useState('');
    const [modulo, setModulo] = useState('');

    const handleSearch = () => onSearch({ fechaDesde, fechaHasta, operador, modulo });

    const handleClear = () => {
        setFechaDesde(''); setFechaHasta(''); setOperador(''); setModulo('');
        onSearch({ fechaDesde: '', fechaHasta: '', operador: '', modulo: '' });
    };

    return (
        <Card title="Filtros de Búsqueda">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
                <Input label="Fecha Desde" name="fechaDesde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                <Input label="Fecha Hasta" name="fechaHasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                <Input label="Operador (DNI/Nombre)" name="operador" value={operador} onChange={(e) => setOperador(e.target.value)} placeholder="Ej: 35123456"/>
                <Select label="Módulo Afectado" name="modulo" value={modulo} onChange={(e) => setModulo(e.target.value)}>
                    <option value="">Todos los módulos</option>
                    <option value="Usuario">Usuarios</option>
                    <option value="Cliente">Clientes</option>
                    <option value="Proveedor">Proveedores</option>
                    <option value="FacturaVenta">Ventas</option>
                    <option value="FacturaCompra">Compras</option>
                </Select>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={handleSearch} style={{ flex: 1 }}><FontAwesomeIcon icon={faSearch} /> Buscar</Button>
                    <Button variant="secondary" onClick={handleClear}><FontAwesomeIcon icon={faEraser} /></Button>
                </div>
            </div>
        </Card>
    );
};