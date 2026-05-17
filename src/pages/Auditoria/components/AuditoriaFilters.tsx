// src/pages/Auditoria/components/AuditoriaFilters.tsx
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Button } from '../../../components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEraser } from '@fortawesome/free-solid-svg-icons';

interface AuditoriaFiltersProps {
    onSearch: (filtros: { fecha: string; operador: string; modulo: string }) => void;
}

export const AuditoriaFilters: React.FC<AuditoriaFiltersProps> = ({ onSearch }) => {
    // Por defecto inicializamos la fecha con hoy
    const hoy = new Date().toISOString().split('T')[0];
    
    const [fecha, setFecha] = useState(hoy);
    const [operador, setOperador] = useState('');
    const [modulo, setModulo] = useState('');

    const handleSearch = () => {
        onSearch({ fecha, operador, modulo });
    };

    const handleClear = () => {
        setFecha('');
        setOperador('');
        setModulo('');
        onSearch({ fecha: '', operador: '', modulo: '' });
    };

    return (
        <Card title="Filtros de Búsqueda">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end' }}>
                <Input 
                    label="Fecha" 
                    name="fecha" 
                    type="date" 
                    value={fecha} 
                    onChange={(e) => setFecha(e.target.value)} 
                />
                <Input 
                    label="Operador (DNI o Nombre)" 
                    name="operador" 
                    value={operador} 
                    onChange={(e) => setOperador(e.target.value)} 
                    placeholder="Ej: 35123456"
                />
                <Select 
                    label="Módulo Afectado" 
                    name="modulo" 
                    value={modulo} 
                    onChange={(e) => setModulo(e.target.value)}
                >
                    <option value="">Todos los módulos</option>
                    <option value="Usuario">Usuarios</option>
                    <option value="FacturaVenta">Ventas</option>
                    <option value="FacturaCompra">Compras</option>
                    <option value="Sistema">Sistema (Login)</option>
                </Select>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={handleSearch} style={{ flex: 1 }}>
                        <FontAwesomeIcon icon={faSearch} /> Buscar
                    </Button>
                    <Button variant="secondary" onClick={handleClear} title="Limpiar filtros">
                        <FontAwesomeIcon icon={faEraser} />
                    </Button>
                </div>
            </div>
        </Card>
    );
};