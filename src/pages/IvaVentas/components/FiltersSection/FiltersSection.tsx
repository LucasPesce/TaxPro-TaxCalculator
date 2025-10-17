// src/pages/IvaVentas/components/FiltersSection/FiltersSection.tsx

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faFileImport } from '@fortawesome/free-solid-svg-icons';

// --- CAMBIOS CLAVE ---
// 1. Importamos nuestros componentes de UI
import { Card } from '../../../../components/ui/Card/Card';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Select/Select';
// 2. Importamos los estilos del MÓDULO
import styles from './FiltersSection.module.css';

export const FiltersSection: React.FC = () => {

    const handleImportClick = () => {
        alert('Botón "Importar Facturas" clickeado!');
    };

    return (
        <Card title="Filtros y Acciones">
            {/* --- SECCIÓN 1: BÚSQUEDA Y FILTROS --- */}
            <div className={styles.filtersContainer}>
                {/* 3. Usamos la clase del módulo para el grid */}
                <div className={styles.filtersGrid}>
                    {/* 4. Reemplazamos los divs por nuestros componentes <Input> y <Select> */}
                    <Input
                        label="Empresa"
                        name="empresa"
                        placeholder="Buscar por CUIT o Razón Social..."
                    />
                    <Select label="Periodo a Liquidar" name="periodo">
                        <option>Seleccionar periodo</option>
                        <option value="2025-02">Febrero 2025</option>
                        <option value="2025-01">Enero 2025</option>
                    </Select>
                    <div className={styles.searchButtonWrapper}>
                        <Button variant="primary">
                            <FontAwesomeIcon icon={faSearch} /> Buscar
                        </Button>
                    </div>
                </div>
            </div>

            <hr className={styles.sectionDivider} />

            {/* --- SECCIÓN 2: IMPORTACIÓN DE ARCHIVOS --- */}
            <div className={styles.importSection}>
                <Button variant="primary" onClick={handleImportClick}>
                    <FontAwesomeIcon icon={faUpload} /> Importar Facturas
                </Button>

                <label htmlFor="archivo" className={styles.fileInputLabel}>
                    <FontAwesomeIcon icon={faFileImport} />
                    Seleccionar archivo
                </label>

                {/* El input oculto sigue siendo el mismo */}
                <input type="file" id="archivo" className={styles.hiddenFileInput} />

                <span className={styles.fileName}>Ningún archivo seleccionado</span>
            </div>
        </Card>
    );
};