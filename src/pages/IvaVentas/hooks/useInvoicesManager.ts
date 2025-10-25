//==================== IMPORTACIONES ====================
import { useState, useMemo } from "react";
import Papa from "papaparse";
import { type Invoice } from "../mock-data";

//==================== DEFINICION DE TIPOS ====================
type SortKey = keyof Invoice;
type SortDirection = "ascending" | "descending";

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
          tipoResponsable: "",
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

  //--- FUNCION: IMPORTACION Y PROCESAMIENTO DE ARCHIVO CSV ---
  const handleFileImport = (file: File) => {
    Papa.parse(file, {
      header: false,
      delimiter: ";",
      skipEmptyLines: true,
      complete: (results) => {
        const parsedInvoices = (results.data as string[][]).map(
          (row: string[], index: number): Invoice => {
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
              id: index + 1,
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
              tipoResponsable: "",
            };
          }
        );

        const validatedAndCompletedInvoices = validateInvoices(parsedInvoices);
        setInvoices(validatedAndCompletedInvoices);
        setCurrentPage(1);
      },
      error: (error: any) => {
        console.error("Error al parsear el CSV:", error);
        alert("Hubo un error al procesar el archivo.");
      },
    });
  };

  //--- FUNCION: ACTUALIZACION DE FACTURA INDIVIDUAL ---
  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setInvoices((prevInvoices) => {
      // 1. Creamos una lista temporal con la factura ya actualizada.
      const invoicesWithUpdate = prevInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      );

      // 2. Pasamos ESA NUEVA LISTA por nuestra función de validación global.
      //    Esto recalculará la correlatividad para todas las facturas.
      const revalidatedInvoices = validateInvoices(invoicesWithUpdate);

      // 3. Establecemos el nuevo estado con los datos completamente validados.
      return revalidatedInvoices;
    });
    // ======================= FIN DEL CAMBIO =======================
    console.log("Factura actualizada y lista re-validada:", updatedInvoice);
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

  //--- RETORNO DEL HOOK ---
  return {
    invoices: paginatedInvoices,
    totalInvoices: invoices.length,
    allInvoices: invoices,
    sortConfig,
    currentPage,
    ITEMS_PER_PAGE,
    handleFileImport,
    handleSort,
    setCurrentPage,
    handleUpdateInvoice,
  };
};
