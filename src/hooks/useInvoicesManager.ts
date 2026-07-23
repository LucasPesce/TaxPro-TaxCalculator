//==================== IMPORTACIONES ====================
import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type Invoice } from "../types";
import { toast } from "sonner";

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
  const sumaIvas =
    dbInvoice.iva25 +
    dbInvoice.iva5 +
    dbInvoice.iva105 +
    dbInvoice.iva21 +
    dbInvoice.iva27;
  const difference = Math.abs(dbInvoice.totalIva - sumaIvas);
  const ivaStatus = difference < 0.1 ? "Correcto" : "Error";

  return {
    ...dbInvoice,
    controlIva: ivaStatus,
    // El backend genera la palabra "--- FACTURA FALTANTE ---" en denominacionReceptor para marcar los huecos
    correlatividad:
      dbInvoice.denominacionReceptor === "--- FACTURA FALTANTE ---"
        ? "Error"
        : "Correcto",
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
  ): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          // 🚨 CONTROL: Si el archivo está vacío o no tiene formato
          if (!results.data || results.data.length === 0) {
            toast.warning(
              "El archivo CSV está vacío o no tiene el formato correcto.",
            );
            return resolve(null); // Cortamos la ejecución sin error fatal
          }

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

          // 🚨 NUEVA LÓGICA DE CONTROL DE MESES MEZCLADOS 🚨
          if (parsedInvoices.length === 0) return resolve(null);

          // Función para extraer el periodo (YYYY-MM) de una fecha
          const extractPeriod = (dateStr: string) => {
            if (!dateStr) return null;
            if (dateStr.includes("-"))
              return `${dateStr.split("-")[0]}-${dateStr.split("-")[1]}`;
            if (dateStr.includes("/"))
              return `${dateStr.split("/")[2]}-${dateStr.split("/")[1]}`;
            return null;
          };

          // Detectamos el mes de la primera factura del archivo
          const targetPeriod = extractPeriod(parsedInvoices[0].fecha);
          let omittedWrongMonth = 0;

          // Filtramos: Solo nos quedamos con las facturas que coincidan con el targetPeriod
          const validInvoices = parsedInvoices.filter((inv: any) => {
            if (extractPeriod(inv.fecha) === targetPeriod) return true;
            omittedWrongMonth++;
            return false;
          });

          if (validInvoices.length === 0) {
            toast.error("No se encontraron facturas válidas en el archivo.");
            return resolve(null);
          }

          try {
            const response = await fetch("/api/facturas/lote", {
              method: "POST",
              headers: getHeaders(),
              // Solo enviamos las válidas al backend
              body: JSON.stringify({
                invoices: validInvoices,
                cuitEmpresa,
                nombreEmpresa,
              }),
            });

            const responseData = await response.json();
            if (!response.ok)
              throw new Error(responseData.error || "Error en servidor");

            // 🚨 LÓGICA DE MENSAJES ACTUALIZADA 🚨
            let mensaje =
              responseData.insertadas > 0
                ? `Se importaron ${responseData.insertadas} comprobantes del periodo ${targetPeriod}.`
                : `El periodo ${targetPeriod} ya estaba cargado.`;

            if (responseData.ignoradas > 0)
              mensaje += ` Se omitieron ${responseData.ignoradas} duplicados.`;
            // Avisamos si descartamos de otros meses
            if (omittedWrongMonth > 0)
              mensaje += ` ⚠️ Se omitieron ${omittedWrongMonth} comprobantes por corresponder a otro periodo.`;

            if (responseData.insertadas === 0 && responseData.ignoradas > 0) {
              toast.warning(mensaje);
            } else if (omittedWrongMonth > 0) {
              toast.warning(mensaje); // Amarillo si hubo mezcla de meses
            } else {
              toast.success(mensaje); // Verde si todo fue perfecto
            }

            if (responseData.huecos > 0) {
              toast.info(
                `El sistema autogeneró ${responseData.huecos} facturas faltantes por saltos de correlatividad.`,
              );
            }
            if (!response.ok)
              throw new Error(responseData.error || "Error en servidor");

            // 🚨 LÓGICA DE MENSAJES INTELIGENTES 🚨
            if (responseData.insertadas === 0 && responseData.ignoradas > 0) {
              toast.warning(
                `Periodo ya cargado: Se omitieron ${responseData.ignoradas} comprobantes porque ya existían en el sistema.`,
              );
            } else {
              toast.success(
                `Se importaron ${responseData.insertadas} comprobantes nuevos. ${responseData.ignoradas > 0 ? `(${responseData.ignoradas} omitidos por estar duplicados).` : ""}`,
              );
            }

            if (responseData.huecos > 0) {
              toast.info(
                `El sistema autogeneró ${responseData.huecos} facturas faltantes por saltos de correlatividad.`,
              );
            }

            let periodoDetectado = null;
            if (parsedInvoices.length > 0) {
              const fechaStr = parsedInvoices[0].fecha; // ej "2025-06-01" o "01/06/2025"
              if (fechaStr.includes("-")) {
                const partes = fechaStr.split("-");
                periodoDetectado = `${partes[0]}-${partes[1]}`;
              } else if (fechaStr.includes("/")) {
                const partes = fechaStr.split("/");
                periodoDetectado = `${partes[2]}-${partes[1]}`;
              }
            }
            resolve(periodoDetectado);
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
    if (hasErrors)
      return toast.error("No se puede impactar: Aún hay facturas con errores.");

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

      if (!response.ok) throw new Error("Respuesta de red no fue ok");

      toast.success(
        "¡Datos impactados correctamente! El proceso ha finalizado.",
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al impactar los datos en el servidor.");
    }
  };

  //--- FUNCION: ELIMINAR PERIODO ---
  const handleDeletePeriod = async (cuitEmpresa: string, periodo: string) => {
    // En este caso, el confirm() de seguridad lo dejamos, pero el resto se va.
    if (
      !window.confirm(
        `⚠️ ADVERTENCIA DE SEGURIDAD: \n\n¿Estás absolutamente seguro de eliminar TODOS los registros de Ventas del cliente ${cuitEmpresa} para el periodo ${periodo}? \n\nEsta acción es destructiva y quedará registrada en auditoría.`,
      )
    )
      return;

    try {
      const response = await fetch("/api/facturas/eliminar-periodo", {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({
          cuitEmpresa,
          periodo,
          tipoOperacion: "IVA Ventas",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al eliminar");

      toast.success(
        "Proceso eliminado correctamente. El periodo está vacío nuevamente.",
      );
      setInvoices([]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
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
    handleDeletePeriod,
  };
};
