import { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { type PurchaseInvoice } from "../types";
import { toast } from "sonner";

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

  // 1. Control de consistencia horizontal (Sumatoria de conceptos)
  const sumaConceptos = g + ex + noG + otros + iva;
  const isSumaCorrecta = Math.abs(tot - sumaConceptos) <= 0.20;

  // 2. Control de correspondencia con tasas nominales argentinas (21%, 10.5%, 27%, 5%, 2.5%, 0%)
  const rates = [0.21, 0.105, 0.27, 0.05, 0.025, 0.0];
  const isRateCoherent = g === 0 ? iva === 0 : rates.some(rate => {
    const expectedIva = g * rate;
    return Math.abs(iva - expectedIva) <= 0.20; // Tolerancia por centavos redondeados
  });

  const ivaStatus = (isSumaCorrecta && isRateCoherent) ? "Validado" : "Observado";

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
const handleFileImport = async (file: File, cuitEmpresa: string, nombreEmpresa: string, ignoreWarning: boolean = false): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          // 🚨 CONTROL DE ARCHIVO VACÍO
          if (!results.data || results.data.length === 0) {
            toast.warning(
              "El archivo CSV está vacío o no tiene el formato correcto.",
            );
            return resolve(null);
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
              fechaEmision: row["Fecha de Emisión"] || "",
              fechaImputacion: row["Fecha de Emisión"] || "",
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
              montoGravado: parseMoney(row["Imp. Neto Gravado"]),
              netoNoGravado: parseMoney(row["Imp. Neto No Gravado"]),
              exento: parseMoney(row["Imp. Op. Exentas"]),
              otrosTributos: parseMoney(row["Otros Tributos"]),
              iva: parseMoney(row["IVA"]),
              total: parseMoney(row["Imp. Total"]),
            };
          });

          // 🚨 NUEVA LÓGICA DE CONTROL DE MESES MEZCLADOS 🚨
          if (parsedInvoices.length === 0) return resolve(null);

          const extractPeriod = (dateStr: string) => {
            if (!dateStr) return null;
            if (dateStr.includes("-"))
              return `${dateStr.split("-")[0]}-${dateStr.split("-")[1]}`;
            if (dateStr.includes("/"))
              return `${dateStr.split("/")[2]}-${dateStr.split("/")[1]}`;
            return null;
          };

          // En compras usamos la fecha de imputación
          const targetPeriod = extractPeriod(parsedInvoices[0].fechaImputacion);
          let omittedWrongMonth = 0;

          const validInvoices = parsedInvoices.filter((inv: any) => {
            if (extractPeriod(inv.fechaImputacion) === targetPeriod)
              return true;
            omittedWrongMonth++;
            return false;
          });

          if (validInvoices.length === 0) {
            toast.error("No se encontraron compras válidas en el archivo.");
            return resolve(null);
          }

          try {
            const response = await fetch("/api/compras/lote", {
              method: "POST",
              headers: getHeaders(),
              // Solo enviamos las válidas al backend
              body: JSON.stringify({
                invoices: validInvoices,
                cuitEmpresa,
                nombreEmpresa,
                ignoreWarning,
              }),
            });

            const responseData = await response.json();
            if (!response.ok)
              throw new Error(responseData.error || "Error en servidor");

            // 🚨 LÓGICA DE MENSAJES ACTUALIZADA 🚨
            let mensaje =
              responseData.insertadas > 0
                ? `Se importaron ${responseData.insertadas} compras del periodo ${targetPeriod}.`
                : `El periodo ${targetPeriod} ya estaba cargado.`;

            if (responseData.ignoradas > 0)
              mensaje += ` Se omitieron ${responseData.ignoradas} duplicados.`;
            // Avisamos si descartamos de otros meses
            if (omittedWrongMonth > 0)
              mensaje += ` ⚠️ Se omitieron ${omittedWrongMonth} comprobantes por corresponder a otro periodo.`;

            if (responseData.insertadas === 0 && responseData.ignoradas > 0) {
              toast.warning(mensaje);
            } else if (omittedWrongMonth > 0) {
              toast.warning(mensaje);
            } else {
              toast.success(mensaje);
            }
            if (!response.ok)
              throw new Error(responseData.error || "Error en servidor");

            // 🚨 LÓGICA DE MENSAJES INTELIGENTES 🚨
            if (responseData.insertadas === 0 && responseData.ignoradas > 0) {
              toast.warning(
                `Periodo ya cargado: Se omitieron ${responseData.ignoradas} compras porque ya existían en el sistema.`,
              );
            } else {
              toast.success(
                `Se importaron ${responseData.insertadas} compras nuevas. ${responseData.ignoradas > 0 ? `(${responseData.ignoradas} omitidas por estar duplicadas).` : ""}`,
              );
            }

            let periodoDetectado = null;

            if (parsedInvoices.length > 0) {
              const fechaStr = parsedInvoices[0].fechaImputacion;
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
    return invoices.some((inv) => inv.controlIva === "Observado");
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
