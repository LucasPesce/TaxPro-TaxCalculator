import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type PurchaseInvoice } from "../types";

type SortKey = keyof PurchaseInvoice;
type SortDirection = "ascending" | "descending";

// --- DICCIONARIO DE COMPROBANTES AFIP ---
const TIPO_CBTE: Record<string, string> = {
  "1": "Factura A",
  "2": "Nota de Débito A",
  "3": "Nota de Crédito A",
  "6": "Factura B",
  "7": "Nota de Débito B",
  "8": "Nota de Crédito B",
  "11": "Factura C",
  "12": "Nota de Débito C",
  "13": "Nota de Crédito C",
  "51": "Factura M",
  "52": "Nota de Débito M",
  "53": "Nota de Crédito M",
  // Puedes agregar más códigos si aparecen
};

// --- MAPEO SEGURO: DB -> FRONTEND ---
const mapDbToFrontend = (db: any): PurchaseInvoice => {
  const g = db.montoGravado || 0;
  const ex = db.exento || 0;
  const noG = db.netoNoGravado || 0;
  const otros = db.otrosTributos || 0;
  const iva = db.iva || 0;
  const tot = db.total || 0;

  // Control matemático: La suma de partes debe ser igual al Total informado
  const sumaConceptos = g + ex + noG + otros + iva;
  const difference = Math.abs(tot - sumaConceptos);
  const ivaStatus = difference < 0.1 ? "Correcto" : "Error";

  return {
    ...db,
    montoGravado: g,
    exento: ex,
    netoNoGravado: noG,
    otrosTributos: otros,
    iva,
    total: tot,
    controlIva: ivaStatus,
  };
};

const parseMoney = (val: string): number => {
  if (!val) return 0;
  // Quita puntos de miles y cambia coma decimal por punto
  const clean = val.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
};

const getHeaders = () => {
  const userStr = localStorage.getItem("usuarioActual");
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    "Content-Type": "application/json",
    "X-Operador-Id": user?.id?.toString() || "0",
    "X-Operador-Doc": user?.documento || "Desconocido",
    "X-Operador-Nombre": user ? `${user.apellido}, ${user.nombre}` : "Sistema",
  };
};

export const useIvaComprasManager = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "fechaImputacion",
    direction: "ascending",
  });

  const ITEMS_PER_PAGE = 5;

  // 1. Cargar datos iniciales
  useEffect(() => {
    // Por defecto no cargamos nada hasta que se busque o importe,
    // o podríamos cargar todo. Mantenemos consistencia con Ventas:
    const fetchInvoices = async () => {
      try {
        const response = await fetch("/api/compras");
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.map(mapDbToFrontend));
        }
      } catch (error) {
        console.error("Error cargando compras:", error);
      }
    };
    //fetchInvoices();
  }, []);

  // --- IMPORTACIÓN ADAPTADA AL CSV DE AFIP ---
  // 🚨 IMPORTACIÓN ADAPTADA AL CSV OFICIAL DE AFIP COMPRAS
  const handleFileImport = async (
    file: File,
    cuitEmpresa: string,
    nombreEmpresa: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("Filas de compras leídas del CSV:", results.data);

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
              fechaEmision: row["Fecha de Emisión"] || "",
              fechaImputacion: row["Fecha de Emisión"] || "", // Por defecto imputa el mismo mes de emisión
              tipoComprobante: row["Tipo de Comprobante"] || "",
              puntoVenta: ptoVenta,
              numeroDesde: nroDesde,
              numeroHasta: (row["Número Hasta"] || "0")
                .toString()
                .padStart(8, "0"),
              numeroFactura: numeroCompleto,
              codAutorizacion: row["Cód. Autorización"] || "",
              tipoDocEmisor: row["Tipo Doc. Emisor"] || "",
              cuitProveedor: row["Nro. Doc. Emisor"] || "",
              proveedor: row["Denominación Emisor"] || "",
              tipoCambio: parseMoney(row["Tipo Cambio"]) || 1,
              moneda: row["Moneda"] || "PES",

              // Importes
              montoGravado: parseMoney(row["Imp. Neto Gravado"]),
              netoNoGravado: parseMoney(row["Imp. Neto No Gravado"]),
              exento: parseMoney(row["Imp. Op. Exentas"]),
              otrosTributos: parseMoney(row["Otros Tributos"]),
              iva: parseMoney(row["IVA"]),
              total: parseMoney(row["Imp. Total"]),
            };
          });

          try {
            const response = await fetch("/api/compras/lote", {
              method: "POST",
              headers: getHeaders(),
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
            alert("Error al importar compras.");
            reject(error);
          }
        },
      });
    });
  };

  const handleSearch = async (searchTerm: string, period: string) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (period) params.append("period", period);

      const res = await fetch(`/api/compras?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.map(mapDbToFrontend));
        setCurrentPage(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateInvoice = async (updated: PurchaseInvoice) => {
    try {
      const res = await fetch(`/api/compras/${updated.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          ...updated,
          tipoOperacion: "IVA Compras",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = mapDbToFrontend(data);
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === mapped.id ? mapped : inv)),
        );
      }
    } catch (e) {
      console.error(e);
      alert("Error al actualizar");
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
    setSortConfig({ key, direction });
  };

  const sortedInvoices = useMemo(() => {
    const items = [...invoices];
    items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return items;
  }, [invoices, sortConfig]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedInvoices, currentPage]);

  // Propiedad computada: ¿Hay errores en la lista actual?
  const hasErrors = useMemo(() => {
    // En compras solo validamos controlIva (no hay correlatividad)
    return invoices.some((inv) => inv.controlIva === "Error");
  }, [invoices]);

  // Función para Impactar
  const handleImpactData = async (cuitEmpresa: string, periodo: string) => {
    if (hasErrors) {
      alert("No se puede impactar: Aún hay facturas con errores de IVA.");
      return;
    }
    if (!cuitEmpresa || !periodo) {
      alert(
        "Por favor, realice una búsqueda por Empresa y Periodo antes de impactar.",
      );
      return;
    }

    try {
      // Reutilizamos el mismo endpoint 'impactar' del backend (es genérico)
      const response = await fetch("/api/facturas/impactar", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          cuitEmpresa,
          periodo,
          tipoOperacion: "IVA Compras", // <--- IMPORTANTE: Diferenciador
        }),
      });

      if (!response.ok) throw new Error("Error al impactar");

      alert("¡Compras impactadas correctamente! El proceso ha finalizado.");
    } catch (error) {
      console.error(error);
      alert("Error al impactar los datos.");
    }
  };
  // 6. Crear Nueva Factura Manualmente
  const handleCreateInvoice = async (newInvoice: PurchaseInvoice) => {
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...newInvoice,
          tipoOperacion: "IVA Compras",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const mapped = mapDbToFrontend(data);
        // Agregamos la nueva factura a la lista local
        setInvoices((prev) => [...prev, mapped]);
      } else {
        throw new Error();
      }
    } catch (e) {
      console.error(e);
      alert("Error al crear la factura.");
    }
  };

  return {
    invoices: paginatedInvoices,
    totalInvoices: invoices.length,
    allInvoices: sortedInvoices,
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
    handleCreateInvoice,
  };
};
