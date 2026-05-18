import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { Select } from '../../../../components/ui/Select/Select';
import { Input } from '../../../../components/ui/Input/Input'; // Asegúrate de importar Input
import styles from './FiltersSection.module.css';

interface FiltersSectionProps {
    // 👇 NUEVA PROP: Le decimos al componente en qué módulo está 👇
    modulo: 'ventas' | 'compras'; 
    onFileImport: (file: File) => void;
    onSearch: (searchTerm: string, period: string) => void;
}

const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 13; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const value = `${date.getFullYear()}-${month}`;
        const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        options.push({ value, label: capitalizedLabel });
    }
    return options;
};

export const FiltersSection: React.FC<FiltersSectionProps> = ({ modulo, onFileImport, onSearch }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const periodOptions = useMemo(() => generatePeriodOptions(), []);
    
    const [searchText, setSearchText] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    
    // Estado solo para Clientes
    const [clientes, setClientes] = useState<{cuitEmpresa: string, razonSocial: string}[]>([]);

    // Cargamos los clientes SOLO si estamos en el módulo de Ventas
    useEffect(() => {
        if (modulo === 'ventas') {
            const fetchClientes = async () => {
                try {
                    const response = await fetch('/api/clientes');
                    if (response.ok) {
                        const data = await response.json();
                        setClientes(data.filter((c: any) => c.activo));
                    }
                } catch (error) {
                    console.error("Error al cargar clientes:", error);
                }
            };
            fetchClientes();
        }
    }, [modulo]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
        } else {
            setSelectedFile(null);
            setFileName('Ningún archivo seleccionado');
        }
    };

    const handleImportClick = () => {
        if (selectedFile) onFileImport(selectedFile);
        else alert('Por favor, selecciona un archivo CSV primero.');
    };

    const handleSearchClick = () => {
        onSearch(searchText, selectedPeriod);
    };

    return (
        <Card title="Filtros y Acciones">
            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    
                    {/* 👇 RENDERIZADO CONDICIONAL 👇 */}
                    {modulo === 'ventas' ? (
                        <Select
                            label="Cliente"
                            name="cliente"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        >
                            <option value="">Todos los clientes...</option>
                            {clientes.map(c => (
                                <option key={c.cuitEmpresa} value={c.cuitEmpresa}>
                                    {c.razonSocial} (CUIT: {c.cuitEmpresa})
                                </option>
                            ))}
                        </Select>
                    ) : (
                        <Input
                            label="Proveedor"
                            name="proveedor"
                            placeholder="Buscar proveedor por nombre o CUIT..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    )}
                    {/* 👆 ---------------------- 👆 */}

                    <Select
                        label="Periodo a Liquidar"
                        name="periodo"
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}>
                        <option value="">Todos los periodos</option>
                        {periodOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    
                    <div className={styles.searchButtonWrapper}>
                        <Button variant="primary" onClick={handleSearchClick}>
                            <FontAwesomeIcon icon={faSearch} /> Buscar
                        </Button>
                    </div>
                </div>
            </div>

            <hr className={styles.sectionDivider} />

            <div className={styles.importSection}>
                <Button variant="primary" onClick={handleImportClick}>
                    <FontAwesomeIcon icon={faUpload} /> Importar Facturas
                </Button>

                <label htmlFor="csv-importer" className={styles.fileInputLabel}>
                    <FontAwesomeIcon icon={faFileImport} />
                    Seleccionar archivo
                </label>

                <input
                    type="file"
                    id="csv-importer"
                    className={styles.hiddenFileInput}
                    accept=".csv"
                    onChange={handleFileChange}
                />

                <span className={styles.fileName}>{fileName}</span>
            </div>
        </Card>
    );
};