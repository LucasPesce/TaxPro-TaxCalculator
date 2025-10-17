import React from 'react';
import { Button } from '../../../../components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../../../../components/ui/Card/Card';

import './FiltersSection.css';

export const FiltersSection: React.FC = () => {
    return (
        <Card>
            {/* --- SECCIÓN 1: BÚSQUEDA Y FILTROS --- */}
            <div className="filters-container">
                <div className="filters-grid">
                    <div className="filter-group">
                       <label htmlFor="empresa">Empresa</label>
                       <input type="text" id="cuit" placeholder="Buscar Empresa..." />
                    </div>
                    <div className="filter-group">
                        <label htmlFor="periodo">Periodo a Liquidar</label>
                        <select id="periodo"><option>Seleccionar periodo</option></select>
                    </div>

                    {/* 2. EL BOTÓN DE BUSCAR VUELVE A ESTAR EN SU PROPIO GRUPO */}
                    <div className="filter-group">
                        <label>&nbsp;</label>
                        <Button className="btn btn-primary" disabled>
                            <FontAwesomeIcon icon={faSearch} /> Buscar
                        </Button>
                    </div>
                </div>
            </div>

            <hr className="section-divider" />

            {/* --- SECCIÓN 2: IMPORTACIÓN DE ARCHIVOS --- */}
            <div className="import-section">
                <Button className="btn btn-accent" disabled>    {/* DESACTIVADO /////////////////////////// */}
                    <FontAwesomeIcon icon={faUpload} /> Importar Facturas
                </Button>

                <label htmlFor="archivo" className="btn btn-file-select">
                    <FontAwesomeIcon icon={faFileImport} />
                    Seleccionar archivo
                </label>
                <input type="file" id="archivo" className="hidden-file-input" />

                <span className="file-name">Ningún archivo seleccionado</span>


            </div>
        </Card>
    );
};