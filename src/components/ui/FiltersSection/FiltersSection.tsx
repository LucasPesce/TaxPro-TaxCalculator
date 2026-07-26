import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUpload, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { Card } from '../Card/Card';
import { Button } from '../Button/Button';
import { Select } from '../Select/Select';
import styles from './FiltersSection.module.css';
import { toast } from 'sonner';

interface FiltersSectionProps {
    modulo: 'ventas' | 'compras';
    onFileImport: (file: File, cuit: string, nombre: string, ignoreWarning: boolean) => Promise<string | null>;
    onSearch: (searchTerm: string, period: string) => void;
    hasData: boolean;
}

const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    // Generamos los últimos 5 años (60 meses) de forma inteligente
    for (let i = 0; i < 60; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const value = `${date.getFullYear()}-${month}`;
        options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
};

export const FiltersSection: React.FC<FiltersSectionProps> = ({ modulo, onFileImport, onSearch, hasData }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const periodOptions = useMemo(() => generatePeriodOptions(), []);

    // Estado común para la búsqueda (Guarda CUIT Cliente o CUIT Proveedor)
    const [selectedCuit, setSelectedCuit] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);


    const [entidades, setEntidades] = useState<{ cuit: string, razonSocial: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Siempre consultamos clientes porque son las empresas que liquidamos
                const response = await fetch('/api/clientes');
                if (response.ok) {
                    const data = await response.json();
                    const activos = data.filter((item: any) => item.activo);
                    const normalizados = activos.map((item: any) => ({
                        cuit: item.cuitEmpresa,
                        razonSocial: item.razonSocial
                    }));
                    setEntidades(normalizados);
                }
            } catch (error) {
                console.error(`Error al cargar empresas para liquidar:`, error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (hasSearched && selectedCuit) {
            onSearch(selectedCuit, selectedPeriod);
        }
    }, [selectedCuit, selectedPeriod]);

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

    const handleImportClick = async () => {
        if (!selectedFile) return alert('Por favor, selecciona un archivo CSV primero.');
        if (!selectedCuit) return alert('Para importar, primero debes seleccionar una Empresa a liquidar.');

const cleanCuit = selectedCuit.replace(/\D/g, ""); 
        let ignoreWarning = false;

        // Función interna para proceder con la carga real
        const proceedWithImport = async (ignore: boolean) => {
            setIsImporting(true);
            const entidad = entidades.find(e => e.cuit === selectedCuit);
            const nombreEmpresa = entidad?.razonSocial || 'Desconocido';

            try {
                const detectedPeriod = await onFileImport(selectedFile, selectedCuit, nombreEmpresa, ignore);

                if (detectedPeriod) {
                    setSelectedPeriod(detectedPeriod);
                    setHasSearched(true);
                    onSearch(selectedCuit, detectedPeriod);
                }

                setSelectedFile(null);
                setFileName('Ningún archivo seleccionado');
                const fileInput = document.getElementById('csv-importer') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

            } catch (error) {
                console.error("Error durante la importación:", error);
            } finally {
                setIsImporting(false);
            }
        };

        // 🚨 CONTROL DE CUIT EN NOMBRE DE ARCHIVO
        if (!selectedFile.name.includes(cleanCuit)) {
            // Desplegamos un Toast interactivo que se queda fijo hasta que el usuario responda
            toast.warning(
                <div>
                    <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>⚠️ ALERTA DE COINCIDENCIA DE CUIT</p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
                        El archivo <strong>{selectedFile.name}</strong> NO contiene el CUIT de la empresa seleccionada ({cleanCuit}).
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        (Ignorar esta alerta quedará registrado en auditoría).
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button 
                            variant="secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => {
                                toast.dismiss(); // Cierra el toast
                                setSelectedFile(null);
                                setFileName('Ningún archivo seleccionado');
                                const fileInput = document.getElementById('csv-importer') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#d32f2f', borderColor: '#d32f2f' }}
                            onClick={() => {
                                toast.dismiss(); // Cierra el toast
                                proceedWithImport(true); // Procede enviando ignoreWarning = true
                            }}
                        >
                            Importar Igualmente
                        </Button>
                    </div>
                </div>, 
                { duration: Infinity, style: { width: '400px' } } // Infinity = no se cierra solo, style = lo hace un poco más ancho
            );
            return; // Cortamos la ejecución aquí, la respuesta del usuario lanzará el proceedWithImport
        }

        // Si el archivo SÍ tiene el CUIT en el nombre, procedemos normal y directo
        proceedWithImport(false);
    };

    const handleSearchClick = () => {
        if (!selectedCuit) {
            return toast.warning("Por favor, seleccione una Empresa a liquidar para poder buscar.");
        }

        setHasSearched(true);
        onSearch(selectedCuit, selectedPeriod);
    };

    const isImportBlocked = !selectedCuit || isImporting;

    return (
        <Card title="Filtros y Acciones">
            <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                    <Select
                        label="Empresa a liquidar"
                        name="entidad"
                        value={selectedCuit}
                        onChange={(e) => setSelectedCuit(e.target.value)}
                    >
                        <option value="">Seleccione una empresa...</option>
                        {entidades.map(ent => (
                            <option key={ent.cuit} value={ent.cuit}>
                                {ent.razonSocial} (CUIT: {ent.cuit})
                            </option>
                        ))}
                    </Select>

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
                <Button
                    variant="primary"
                    onClick={handleImportClick}
                    disabled={isImportBlocked}
                    title={!selectedCuit ? "Seleccione una empresa para importar." : "El sistema detectará el mes automáticamente."}
                >
                    <FontAwesomeIcon icon={faUpload} /> {isImporting ? "Procesando..." : "Importar Facturas"}
                </Button>

                <label
                    htmlFor="csv-importer"
                    className={styles.fileInputLabel}
                    style={{ opacity: isImportBlocked ? 0.5 : 1, pointerEvents: isImportBlocked ? 'none' : 'auto' }}
                >
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