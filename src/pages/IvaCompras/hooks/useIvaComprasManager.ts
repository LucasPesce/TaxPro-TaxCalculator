import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type PurchaseInvoice } from "../../../types";

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
  const calculatedIva21 = db.montoGravado * 0.21;

  const difference = Math.abs(calculatedIva21 - db.iva21);
  const ivaStatus = difference < 0.05 ? "Correcto" : "Error";

  return {
    id: db.id,
    cuitEmpresa: db.cuitEmpresa,
    nombreEmpresa: db.nombreEmpresa,
    proveedor: db.proveedor,
    cuitProveedor: db.cuitProveedor,
    condicionIva: db.condicionIva,
    doc: db.tipoDocumento,
    nro: db.numeroFactura,
    fechaEmision: db.fechaEmision,
    fechaImputacion: db.fechaImputacion,
    provincia: db.provincia,
    jurisdiccion: db.jurisdiccion,
    clasificacion: db.clasificacion,

    montoGravado: db.montoGravado,
    exento: db.exento,
    percIva: db.percIva,
    percIIBB: db.percIIBB,
    percMun: db.percMun,
    ganancias: db.ganancias,
    iva27: db.iva27,
    iva21: db.iva21,
    iva105: db.iva105,
    otrasRetenciones: db.otrasRetenciones,
    total: db.total,

    controlIva: ivaStatus,
  };
};

const parseMoney = (val: string): number => {
  if (!val) return 0;
  // Quita puntos de miles y cambia coma decimal por punto
  const clean = val.toString().replace(/\./g, "").replace(",", ".");
  return parseFloat(clean) || 0;
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
    fetchInvoices();
  }, []);

  // --- IMPORTACIÓN ADAPTADA AL CSV DE AFIP ---
  const handleFileImport = (file: File) => {
    const cuitEmpresa = prompt("Ingrese CUIT de SU Empresa (Comprador):");
    if (!cuitEmpresa) return;
    const nombreEmpresa = prompt("Ingrese Nombre de SU Empresa:");
    if (!nombreEmpresa) return;

    Papa.parse(file, {
      header: true,
      delimiter: ";", // IMPORTANTE: Tu archivo usa punto y coma
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedInvoices = results.data.map((row: any) => {
          // 1. Armar Número de Comprobante (0007-00023449)
          const ptoVenta = (row["Punto de Venta"] || "0")
            .toString()
            .padStart(4, "0");
          const nroDesde = (row["Número Desde"] || "0")
            .toString()
            .padStart(8, "0");
          const numeroCompleto = `${ptoVenta}-${nroDesde}`;

          // 2. Traducir Tipo de Comprobante (1 -> Factura A)
          const codigoTipo = row["Tipo de Comprobante"]?.toString() || "0";
          const tipoDoc = TIPO_CBTE[codigoTipo] || `Código ${codigoTipo}`;

          // 3. Parsear Importes
          const gravado = parseMoney(row["Imp. Neto Gravado"]);
          const noGravado = parseMoney(row["Imp. Neto No Gravado"]);
          const exento = parseMoney(row["Imp. Op. Exentas"]);
          const otrosTrib = parseMoney(row["Otros Tributos"]); // Va a 'Otras Retenciones' por ahora
          const total = parseMoney(row["Imp. Total"]);
          const ivaTotal = parseMoney(row["IVA"]);

          // --- DEDUCCIÓN AUTOMÁTICA DE ALÍCUOTA ---
          let iva21 = 0;
          let iva105 = 0;
          let iva27 = 0;

          if (gravado > 0 && ivaTotal > 0) {
            const ratio = ivaTotal / gravado;

            // Usamos rangos pequeños por si hay diferencias de centavos
            if (ratio > 0.2 && ratio < 0.22) {
              iva21 = ivaTotal;
            } else if (ratio > 0.1 && ratio < 0.11) {
              iva105 = ivaTotal;
            } else if (ratio > 0.26 && ratio < 0.28) {
              iva27 = ivaTotal;
            } else {
              // Si no coincide con ninguno (ej: mix de alícuotas),
              // lo ponemos en 21% por defecto para que el usuario revise.
              iva21 = ivaTotal;
            }
          }

          return {
            cuitEmpresa,
            nombreEmpresa,

            proveedor: row["Denominación Emisor"] || "Desconocido",
            cuitProveedor: row["Nro. Doc. Emisor"] || "0",
            condicionIva: "Resp. Inscripto", // Dato no presente en este CSV simplificado, default.
            doc: tipoDoc,
            nro: numeroCompleto,
            fechaEmision: row["Fecha de Emisión"] || "",
            fechaImputacion: row["Fecha de Emisión"] || "", // Default a emisión
            provincia: "Córdoba", // Default o sacar de otro lado
            jurisdiccion: "Córdoba", // Default
            clasificacion: "Mercadería",

            montoGravado: gravado,
            exento: exento + noGravado,
            percIva: 0, // No presente en este CSV
            percIIBB: 0, // No presente en este CSV
            percMun: 0, // No presente en este CSV
            ganancias: 0,
            iva27: iva27,
            iva21: iva21,
            iva105: iva105,
            otrasRetenciones: otrosTrib,
            total: total,
          };
        });

        try {
          const response = await fetch("/api/compras/lote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              invoices: parsedInvoices,
              cuitEmpresa,
              nombreEmpresa,
              tipoOperacion: "IVA Compras",
            }),
          });

          if (!response.ok) throw new Error("Error en servidor");
          const savedData = await response.json();
          setInvoices(savedData.map(mapDbToFrontend));
          setCurrentPage(1);
        } catch (error) {
          console.error(error);
          alert("Error al importar compras.");
        }
      },
    });
  };

  const handleSearch = async (searchTerm: string, period: string) => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (period) params.append("period", period);

      const res = await fetch(`/api/compras?${params}`);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updated,
          tipoOperacion: "IVA Compras",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = mapDbToFrontend(data);
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === mapped.id ? mapped : inv))
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
        "Por favor, realice una búsqueda por Empresa y Periodo antes de impactar."
      );
      return;
    }

    try {
      // Reutilizamos el mismo endpoint 'impactar' del backend (es genérico)
      const response = await fetch("/api/facturas/impactar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
