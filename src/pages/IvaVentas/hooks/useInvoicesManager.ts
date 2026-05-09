//==================== IMPORTACIONES ====================
import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type Invoice } from "../../../types";

//==================== DEFINICION DE TIPOS ====================
type SortKey = keyof Invoice;
type SortDirection = "ascending" | "descending";

//==================== FUNCION AUXILIAR: CALCULO IVA ====================
// Función para calcular si el IVA es correcto matemáticamente
const calculateIvaStatus = (
  total: number,
  percMun: number,
  percIIBB: number,
  montoGravado: number
): "Correcto" | "Error" => {
  const calculatedMontoGravado = (total - percMun - percIIBB) / 1.21;
  const difference = Math.abs(montoGravado - calculatedMontoGravado);
  return difference < 0.01 ? "Correcto" : "Error";
};

//==================== FUNCION AUXILIAR: MAPEO DB -> FRONTEND ====================
// Convierte los nombres de la BD (numeroFactura) a los del Frontend (nro)
const mapDbToFrontend = (dbInvoice: any): Invoice => {
  // Calculamos el estado del IVA al vuelo
  const ivaStatus = calculateIvaStatus(
    dbInvoice.total,
    dbInvoice.percMun,
    dbInvoice.percIIBB,
    dbInvoice.montoGravado
  );

  return {
    id: dbInvoice.id,
    cliente: dbInvoice.cliente,
    condIva: dbInvoice.condicionIva as any,
    doc: dbInvoice.tipoDocumento,
    docNumero: dbInvoice.numeroDocumento,
    fecha: dbInvoice.fecha,
    nro: dbInvoice.numeroFactura,
    montoGravado: dbInvoice.montoGravado,
    iva21: dbInvoice.iva21,
    percIIBB: dbInvoice.percIIBB,
    percMun: dbInvoice.percMun,
    total: dbInvoice.total,
    provincia: dbInvoice.provincia,
    controlIva: ivaStatus,
    correlatividad: "Correcto",
  };
};
//==================== FUNCION: VALIDACION DE FACTURAS ====================
const validateInvoices = (invoices: Invoice[]): Invoice[] => {
  //--- AGRUPACION POR PUNTO DE VENTA Y TIPO DE COMPROBANTE ---
  const groupedInvoices = new Map<string, Invoice[]>();

  invoices.forEach((invoice) => {
    if (invoice.nro && invoice.nro.includes("-") && invoice.doc) {
      const puntoDeVenta = invoice.nro.split("-")[0];
      const tipoComprobante = invoice.doc.trim();
      const groupKey = `${puntoDeVenta}-${tipoComprobante}`;

      if (!groupedInvoices.has(groupKey)) {
        groupedInvoices.set(groupKey, []);
      }
      groupedInvoices.get(groupKey)!.push(invoice);
    } else {
      console.warn(
        "Factura descartada por datos insuficientes para agrupar:",
        invoice
      );
    }
  });

  //--- VERIFICACION DE CORRELATIVIDAD Y RELLENO DE HUECOS ---
  const validatedInvoicesWithGaps: Invoice[] = [];

  groupedInvoices.forEach((group, groupKey) => {
    if (group.length === 0) return;

    const [puntoDeVenta, tipoComprobante] = groupKey.split("-");

    const sortedGroup = group.sort((a, b) => {
      const numA = parseInt(a.nro.split("-")[1]);
      const numB = parseInt(b.nro.split("-")[1]);
      return numA - numB;
    });

    const firstNum = parseInt(sortedGroup[0].nro.split("-")[1]);
    const lastNum = parseInt(
      sortedGroup[sortedGroup.length - 1].nro.split("-")[1]
    );

    let invoicePointer = 0;

    for (let i = firstNum; i <= lastNum; i++) {
      const currentInvoiceInGroup = sortedGroup[invoicePointer];
      const currentInvoiceNumber = currentInvoiceInGroup
        ? parseInt(currentInvoiceInGroup.nro.split("-")[1])
        : -1;

      if (currentInvoiceNumber === i) {
        validatedInvoicesWithGaps.push(currentInvoiceInGroup);
        invoicePointer++;
      } else {
        console.warn(
          `¡Hueco detectado! Falta ${tipoComprobante} nro ${puntoDeVenta}-${String(
            i
          ).padStart(8, "0")}`
        );
        const missingInvoice: Invoice = {
          id: -i * Math.random(),
          cliente: "--- FACTURA FALTANTE ---",
          condIva: "" as any,
          doc: tipoComprobante,
          docNumero: 0,
          fecha: "",
          nro: `${puntoDeVenta}-${String(i).padStart(8, "0")}`,
          montoGravado: 0,
          iva21: 0,
          percIIBB: 0,
          percMun: 0,
          total: 0,
          provincia: "",
          controlIva: "Error",
          correlatividad: "Error",
        };
        validatedInvoicesWithGaps.push(missingInvoice);
      }
    }
  });

  //--- VERIFICACION DE COMPLETITUD DE DATOS INDIVIDUALES ---
  const finalInvoices = validatedInvoicesWithGaps.map((invoice) => {
    if (invoice.correlatividad === "Error") {
      return invoice;
    }

    let hasCompletenessError = false;
    if (!invoice.cliente || !invoice.fecha || invoice.total === 0) {
      hasCompletenessError = true;
    }
    if (
      invoice.condIva === "Responsable Inscripto" &&
      (invoice.docNumero === 0 || !invoice.docNumero)
    ) {
      hasCompletenessError = true;
    }

    const newCorrelatividadStatus: "Correcto" | "Error" = hasCompletenessError
      ? "Error"
      : "Correcto";

    return { ...invoice, correlatividad: newCorrelatividadStatus };
  });

  //--- LIMPIEZA Y ORDENAMIENTO FINAL ---
  const filteredFinalInvoices = finalInvoices.filter(
    (invoice) => invoice.nro !== "0000-00000000"
  );

  return filteredFinalInvoices.sort((a, b) => a.nro.localeCompare(b.nro));
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
    key: "nro",
    direction: "ascending",
  });

  //--- CONSTANTES DE CONFIGURACION ---
  const ITEMS_PER_PAGE = 5;

  //--- EFECTO: CARGAR DATOS INICIALES DESDE EL BACKEND ---
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/facturas");
        if (!response.ok) throw new Error("Error de red");
        const dataFromDb = await response.json();

        // 1. Traducir de DB a Frontend
        const mappedInvoices = dataFromDb.map(mapDbToFrontend);
        // 2. Aplicar tu lógica de validación (huecos, errores)
        const validatedInvoices = validateInvoices(mappedInvoices);

        setInvoices(validatedInvoices);
      } catch (error) {
        console.error("Error cargando facturas:", error);
      }
    };
    fetchInvoices();
  }, []);

  //--- FUNCION: IMPORTACION Y PROCESAMIENTO DE ARCHIVO CSV ---
  const handleFileImport = (file: File) => {
    const cuitEmpresa = prompt("Ingrese CUIT de la empresa:");
    if (!cuitEmpresa) return;
    const nombreEmpresa = prompt("Ingrese Nombre de la empresa:");
    if (!nombreEmpresa) return;

    Papa.parse(file, {
      header: false,
      delimiter: ";",
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedInvoices = (results.data as string[][]).map(
          (row: string[]): any => {
            const montoGravado =
              parseFloat(String(row[6]).replace(",", ".")) || 0;
            const iva21 = parseFloat(String(row[7]).replace(",", ".")) || 0;
            const percIIBB = parseFloat(String(row[8]).replace(",", ".")) || 0;
            const percMun = parseFloat(String(row[9]).replace(",", ".")) || 0;
            const total = parseFloat(String(row[10]).replace(",", ".")) || 0;

            const calculatedMontoGravado = (total - percMun - percIIBB) / 1.21;
            const difference = Math.abs(montoGravado - calculatedMontoGravado);
            const ivaStatus = difference < 0.01 ? "Correcto" : "Error";

            return {
              cliente: row[0] || "",
              condIva: (row[1] as any) || "",
              docNumero: Number(row[2]) || 0,
              fecha: row[3] || "",
              doc: row[4] || "",
              nro: row[5] || "",
              montoGravado,
              iva21,
              percIIBB,
              percMun,
              total,
              provincia: row[11] || "",
              controlIva: ivaStatus,
              correlatividad: "Correcto",
            };
          }
        );

        try {
          // ENVIAMOS LOS DATOS RECIBIDOS POR PARAMETRO
          const response = await fetch("/api/facturas/lote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoices: parsedInvoices,
              cuitEmpresa: cuitEmpresa, // Usamos el parámetro
              nombreEmpresa: nombreEmpresa, // Usamos el parámetro
              tipoOperacion: "IVA Ventas",
            }),
          });

          if (!response.ok) throw new Error("Error guardando en servidor");

          const savedDataFromDb = await response.json();
          const mappedData = savedDataFromDb.map(mapDbToFrontend);
          const validatedFinalData = validateInvoices(mappedData);

          setInvoices(validatedFinalData);
          setCurrentPage(1);
        } catch (error) {
          console.error("Error guardando importación:", error);
          alert("Error al guardar los datos en la base de datos.");
        }
      },
      error: (error: any) => {
        console.error("Error al parsear el CSV:", error);
        alert("Hubo un error al procesar el archivo.");
      },
    });
  };

  //--- FUNCION: ACTUALIZACION DE FACTURA INDIVIDUAL ---
  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      const response = await fetch(`/api/facturas/${updatedInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedInvoice,
          tipoOperacion: "IVA Ventas",
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      const updatedDataFromDb = await response.json();
      const mappedUpdatedInvoice = mapDbToFrontend(updatedDataFromDb);

      setInvoices((prevInvoices) => {
        // 1. Actualizamos la lista local
        const invoicesWithUpdate = prevInvoices.map((invoice) =>
          invoice.id === mappedUpdatedInvoice.id
            ? mappedUpdatedInvoice
            : invoice
        );
        // 2. Re-validamos huecos y consistencia
        return validateInvoices(invoicesWithUpdate);
      });
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

      // Procesamos los datos recibidos igual que en la carga inicial
      const mappedInvoices = dataFromDb.map(mapDbToFrontend);
      const validatedInvoices = validateInvoices(mappedInvoices);

      setInvoices(validatedInvoices);
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
      (inv) => inv.controlIva === "Error" || inv.correlatividad === "Error"
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
        "Por favor, realice una búsqueda por Empresa y Periodo antes de impactar."
      );
      return;
    }

    try {
      const response = await fetch("/api/facturas/impactar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
