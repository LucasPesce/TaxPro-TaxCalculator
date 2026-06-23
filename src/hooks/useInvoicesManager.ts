//==================== IMPORTACIONES ====================
import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type Invoice } from "../types";

//==================== DEFINICION DE TIPOS ====================
type SortKey = keyof Invoice;
type SortDirection = "ascending" | "descending";

//==================== FUNCIONES AUXILIARES ====================
const parseMoney = (val: string | number): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  const clean = val.replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
};

// --- MAPEO DE DB A FRONTEND (CORREGIDO Y SIN DUPLICAR) ---
const mapDbToFrontend = (dbInvoice: any): Invoice => {
    // Calculamos si el IVA Total cargado coincide con la sumatoria de las distintas alícuotas
    const sumaIvas = dbInvoice.iva25 + dbInvoice.iva5 + dbInvoice.iva105 + dbInvoice.iva21 + dbInvoice.iva27;
    const difference = Math.abs(dbInvoice.totalIva - sumaIvas);
    const ivaStatus = difference < 0.1 ? "Correcto" : "Error";

    return {
        ...dbInvoice,
        controlIva: ivaStatus,
        // El backend genera la palabra "--- FACTURA FALTANTE ---" en denominacionReceptor para marcar los huecos
        correlatividad: dbInvoice.denominacionReceptor === "--- FACTURA FALTANTE ---" ? "Error" : "Correcto"
    };
};

//==================== CUSTOM HOOK: useInvoicesManager ====================
export const useInvoicesManager = () => {
  //--- ESTADOS INTERNOS ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "numeroFactura", // 🚨 CORREGIDO: 'nro' ya no existe en el tipo Invoice, ahora es 'numeroFactura'
    direction: "ascending",
  });

  //--- CONSTANTES DE CONFIGURACION ---
  const ITEMS_PER_PAGE = 5;

  //--- EFECTO: CARGAR DATOS INICIALES DESDE EL BACKEND ---
  useEffect(() => {
    // No cargamos datos por defecto para que la tabla empiece vacía
    // fetchInvoices();
  }, []);

  const getHeaders = () => {
    const userStr = localStorage.getItem("usuarioActual");
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      "Content-Type": "application/json",
      "X-Operador-Id": user?.id?.toString() || "0",
      "X-Operador-Doc": user?.documento || "Desconocido",
      "X-Operador-Nombre": user
        ? `${user.apellido}, ${user.nombre}`
        : "Sistema",
    };
  };

  //--- FUNCION: IMPORTACION Y PROCESAMIENTO DE ARCHIVO CSV ---
  const handleFileImport = async (
    file: File,
    cuitEmpresa: string,
    nombreEmpresa: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true, // 🚨 AHORA LEE LOS TÍTULOS DE AFIP DIRECTAMENTE
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("Filas crudas leídas del CSV:", results.data); // 🚨 CONTROL: Ver qué leyó del archivo

          const parsedInvoices = results.data.map((row: any) => {
            const ptoVenta = (row["Punto de Venta"] || "0")
              .toString()
              .padStart(4, "0");
            const nroDesde = (row["Número Desde"] || "0")
              .toString()
              .padStart(8, "0");
            const numeroCompleto = `${ptoVenta}-${nroDesde}`;

            return {
              cuitEmpresa,
              nombreEmpresa,
              fecha: row["Fecha de Emisión"] || "",
              tipoComprobante: row["Tipo de Comprobante"] || "",
              puntoVenta: ptoVenta,
              numeroDesde: nroDesde,
              numeroHasta: (row["Número Hasta"] || "0")
                .toString()
                .padStart(8, "0"),
              numeroFactura: numeroCompleto,
              codAutorizacion: row["Cód. Autorización"] || "",
              tipoDocReceptor: row["Tipo Doc. Receptor"] || "",
              nroDocReceptor: row["Nro. Doc. Receptor"] || "",
              denominacionReceptor: row["Denominación Receptor"] || "",
              tipoCambio: parseMoney(row["Tipo Cambio"]) || 1,
              moneda: row["Moneda"] || "PES",

              netoGravado0: parseMoney(row["Imp. Neto Gravado IVA 0%"]),
              iva25: parseMoney(row["IVA 2,5%"]),
              netoGravado25: parseMoney(row["Imp. Neto Gravado IVA 2,5%"]),
              iva5: parseMoney(row["IVA 5%"]),
              netoGravado5: parseMoney(row["Imp. Neto Gravado IVA 5%"]),
              iva105: parseMoney(row["IVA 10,5%"]),
              netoGravado105: parseMoney(row["Imp. Neto Gravado IVA 10,5%"]),
              iva21: parseMoney(row["IVA 21%"]),
              netoGravado21: parseMoney(row["Imp. Neto Gravado IVA 21%"]),
              iva27: parseMoney(row["IVA 27%"]),
              netoGravado27: parseMoney(row["Imp. Neto Gravado IVA 27%"]),
              montoGravadoTotal: parseMoney(row["Imp. Neto Gravado Total"]),
              netoNoGravado: parseMoney(row["Imp. Neto No Gravado"]),
              operacionesExentas: parseMoney(row["Imp. Op. Exentas"]),
              otrosTributos: parseMoney(row["Otros Tributos"]),
              totalIva: parseMoney(row["Total IVA"]),
              total: parseMoney(row["Imp. Total"]),
            };
          });

          try {
            const response = await fetch("/api/facturas/lote", {
              method: "POST",
              headers: getHeaders(), // 🚨 ESTO ES LO QUE REGISTRA LA AUDITORÍA
              body: JSON.stringify({
                invoices: parsedInvoices,
                cuitEmpresa,
                nombreEmpresa,
              }),
            });
            if (!response.ok) throw new Error("Error en servidor");
            resolve();
          } catch (error) {
            console.error(error);
            alert("Error al importar ventas.");
            reject(error);
          }
        },
      });
    });
  };

  //--- FUNCION: ACTUALIZACION DE FACTURA INDIVIDUAL ---
  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      const response = await fetch(`/api/facturas/${updatedInvoice.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          ...updatedInvoice,
          tipoOperacion: "IVA Ventas",
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      const updatedDataFromDb = await response.json();
      const mappedUpdatedInvoice = mapDbToFrontend(updatedDataFromDb);

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === mappedUpdatedInvoice.id ? mappedUpdatedInvoice : inv,
        ),
      );

      console.log("Factura actualizada en BD y validada localmente");
    } catch (error) {
      console.error("Error actualizando factura:", error);
      alert("No se pudo guardar el cambio en el servidor");
    }
  };

  // --- FUNCION: BUSCAR FACTURAS EN EL SERVIDOR ---
  const handleSearch = async (searchTerm: string, period: string) => {
    try {
      // Construimos la URL con los parámetros
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append("search", searchTerm);
      if (period) queryParams.append("period", period);

      const response = await fetch(`/api/facturas?${queryParams.toString()}`);

      if (!response.ok) throw new Error("Error al buscar");

      const dataFromDb = await response.json();
      setInvoices(dataFromDb.map(mapDbToFrontend));
      setCurrentPage(1); // Volver a la primera página de resultados
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      alert("Error al realizar la búsqueda.");
    }
  };

  //--- FUNCION: MANEJO DEL CAMBIO DE ORDENAMIENTO ---
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  //--- MEMOIZACION: ORDENAMIENTO DE FACTURAS ---
  const sortedInvoices = useMemo(() => {
    const sortableItems = [...invoices];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      let comparison = 0;
      if (valA > valB) comparison = 1;
      else if (valA < valB) comparison = -1;
      return sortConfig.direction === "descending"
        ? comparison * -1
        : comparison;
    });
    return sortableItems;
  }, [invoices, sortConfig]);

  //--- MEMOIZACION: PAGINACION DE FACTURAS ---
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedInvoices, currentPage]);

  //--- CALCULO: VERIFICAR SI HAY ERRORES (Para botón Impactar) ---
  const hasErrors = useMemo(() => {
    return invoices.some(
      (inv) => inv.controlIva === "Error" || inv.correlatividad === "Error",
    );
  }, [invoices]);

  //--- FUNCION: IMPACTAR DATOS (Finalizar Proceso) ---
  const handleImpactData = async (cuitEmpresa: string, periodo: string) => {
    if (hasErrors) {
      alert("No se puede impactar: Aún hay facturas con errores.");
      return;
    }
    if (!cuitEmpresa || !periodo) {
      alert(
        "Por favor, realice una búsqueda por Empresa y Periodo antes de impactar.",
      );
      return;
    }

    try {
      const response = await fetch("/api/facturas/impactar", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          cuitEmpresa,
          periodo,
          tipoOperacion: "IVA Ventas",
        }),
      });

      if (!response.ok) throw new Error("Error al impactar");

      alert("¡Datos impactados correctamente! El proceso ha finalizado.");
    } catch (error) {
      console.error(error);
      alert("Error al impactar los datos.");
    }
  };

  //--- RETORNO DEL HOOK ---
  return {
    invoices: paginatedInvoices,
    totalInvoices: invoices.length,
    allInvoices: invoices,
    sortConfig,
    currentPage,
    ITEMS_PER_PAGE,
    handleFileImport,
    handleSearch,
    handleSort,
    setCurrentPage,
    handleUpdateInvoice,
    hasErrors,
    handleImpactData,
  };
};