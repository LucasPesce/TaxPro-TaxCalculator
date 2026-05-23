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

// --- MAPEO: DB -> FRONTEND  ---
const mapDbToFrontend = (db: any): PurchaseInvoice => {
  // Aseguramos que los números nunca sean nulos o indefinidos para que no se rompa la app
  const montoGravado = db.montoGravado || 0;
  const iva21 = db.iva21 || 0;

  const calculatedIva21 = montoGravado * 0.21;
  const difference = Math.abs(calculatedIva21 - iva21);
  const ivaStatus = difference < 0.05 ? "Correcto" : "Error";

  return {
    id: db.id,
    cuitEmpresa: db.cuitEmpresa || "",
    nombreEmpresa: db.nombreEmpresa || "",
    proveedor: db.proveedor || "",
    cuitProveedor: db.cuitProveedor || "",
    condicionIva: db.condicionIva || "",
    doc: db.tipoDocumento || "",
    nro: db.numeroFactura || "",
    fechaEmision: db.fechaEmision || "",
    fechaImputacion: db.fechaImputacion || "",
    provincia: db.provincia || "",
    jurisdiccion: db.jurisdiccion || "",
    clasificacion: db.clasificacion || "",
    montoGravado,
    exento: db.exento || 0,
    percIva: db.percIva || 0,
    percIIBB: db.percIIBB || 0,
    percMun: db.percMun || 0,
    ganancias: db.ganancias || 0,
    iva27: db.iva27 || 0,
    iva21,
    iva105: db.iva105 || 0,
    otrasRetenciones: db.otrasRetenciones || 0,
    total: db.total || 0,
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
          console.log("Filas crudas leídas del CSV:", results.data); // 🚨 CONTROL: Ver qué leyó del archivo

          const parsedInvoices = results.data.map((row: any) => {
            const ptoVenta = (row["Punto de Venta"] || "0")
              .toString()
              .padStart(4, "0");
            const nroDesde = (row["Número Desde"] || "0")
              .toString()
              .padStart(8, "0");
            const numeroCompleto = `${ptoVenta}-${nroDesde}`;

            const codigoTipo = row["Tipo de Comprobante"]?.toString() || "0";
            const tipoDoc = TIPO_CBTE[codigoTipo] || `Código ${codigoTipo}`;

            const gravado = parseMoney(row["Imp. Neto Gravado"]);
            const noGravado = parseMoney(row["Imp. Neto No Gravado"]);
            const exento = parseMoney(row["Imp. Op. Exentas"]);
            const otrosTrib = parseMoney(row["Otros Tributos"]);
            const total = parseMoney(row["Imp. Total"]);
            const ivaTotal = parseMoney(row["IVA"]);

            let iva21 = 0,
              iva105 = 0,
              iva27 = 0;
            if (gravado > 0 && ivaTotal > 0) {
              const ratio = ivaTotal / gravado;
              if (ratio > 0.2 && ratio < 0.22) iva21 = ivaTotal;
              else if (ratio > 0.1 && ratio < 0.11) iva105 = ivaTotal;
              else if (ratio > 0.26 && ratio < 0.28) iva27 = ivaTotal;
              else iva21 = ivaTotal;
            }

            return {
              cuitEmpresa,
              nombreEmpresa,
              proveedor: row["Denominación Emisor"] || "Desconocido",
              cuitProveedor: row["Nro. Doc. Emisor"] || "0",
              condicionIva: "Resp. Inscripto",
              doc: tipoDoc,
              nro: numeroCompleto,
              fechaEmision: row["Fecha de Emisión"] || "",
              fechaImputacion: row["Fecha de Emisión"] || "",
              provincia: "Córdoba",
              jurisdiccion: "Córdoba",
              clasificacion: "Mercadería",
              montoGravado: gravado,
              exento: exento + noGravado,
              percIva: 0,
              percIIBB: 0,
              percMun: 0,
              ganancias: 0,
              iva27,
              iva21,
              iva105,
              otrasRetenciones: otrosTrib,
              total,
            };
          });

          try {
            const response = await fetch("/api/compras/lote", {
              method: "POST",
              headers: getHeaders(), // 🚨 ESTO ES LO QUE REGISTRA LA AUDITORÍA
              body: JSON.stringify({
                invoices: parsedInvoices,
                cuitEmpresa,
                nombreEmpresa,
                tipoOperacion: "IVA Compras",
              }),
            });

            if (!response.ok) throw new Error("Error en servidor");
            resolve(); // Terminó bien
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
