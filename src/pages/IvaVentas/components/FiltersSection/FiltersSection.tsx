//================ IMPORTACIONES ====================
import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Select/Select';
import styles from './FiltersSection.module.css';

//================ DEFINICIÓN DE PROPS ====================
interface FiltersSectionProps {
    onFileImport: (file: File) => void;
}

//================ FUNCIÓN AUXILIAR PARA PERÍODOS ====================
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

//================ COMPONENTE PRINCIPAL: FiltersSection ====================
export const FiltersSection: React.FC<FiltersSectionProps> = ({ onFileImport }) => {
    
    //================ ESTADO Y VALORES MEMOIZADOS ====================
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const periodOptions = useMemo(() => generatePeriodOptions(), []);

    //================ MANEJADORES DE EVENTOS ====================
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
        if (selectedFile) {
            onFileImport(selectedFile);
        } else {
            alert('Por favor, selecciona un archivo CSV primero.');
        }
    };

    //================ RENDERIZADO DEL COMPONENTE ====================
    return (
        <Card title="Filtros y Acciones">
            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <Input
                        label="Empresa"
                        name="empresa"
                        placeholder="Buscar por CUIT o Razón Social..."
                    />
                    <Select label="Periodo a Liquidar" name="periodo">
                        <option value="">Seleccionar periodo</option>
                        {periodOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <div className={styles.searchButtonWrapper}>
                        <Button variant="primary">
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