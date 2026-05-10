// src/pages/Auditoria/hooks/useAuditoriaManager.ts
import { useState, useEffect, useMemo } from "react";

export interface Actividad {
  id: number;
  fechaHora: string;
  operadorDoc: string;
  operadorNombre: string;
  accion: string;
  entidadAfectada: string;
  detalles: string;
}

type SortKey = keyof Actividad;
type SortDirection = "ascending" | "descending";

export const useAuditoriaManager = () => {
  const [registros, setRegistros] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // 10 registros por página

  // Ordenamiento por defecto: Fecha más reciente
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "fechaHora",
    direction: "descending",
  });

  // Función de búsqueda (se exporta para que el componente de filtros la use)
  const fetchAuditoria = async (filtros?: {
    fecha?: string;
    operador?: string;
    modulo?: string;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros?.fecha) params.append("fecha", filtros.fecha);
      if (filtros?.operador) params.append("operador", filtros.operador);
      if (filtros?.modulo) params.append("modulo", filtros.modulo);

      const res = await fetch(`/api/auditoria?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRegistros(data);
        setCurrentPage(1); // Volvemos a la pag 1 al buscar
      }
    } catch (error) {
      console.error("Error fetching auditoría:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al cargar la pantalla por primera vez, buscamos SOLO los del día de hoy
  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
    fetchAuditoria({ fecha: hoy });
  }, []);

  // Lógica de Ordenamiento
  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedRegistros = useMemo(() => {
    const items = [...registros];
    items.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key])
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key])
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return items;
  }, [registros, sortConfig]);

  // Lógica de Paginación
  const paginatedRegistros = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRegistros.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRegistros, currentPage]);

  return {
    registros: paginatedRegistros,
    totalRegistros: registros.length,
    loading,
    sortConfig,
    currentPage,
    ITEMS_PER_PAGE,
    setCurrentPage,
    handleSort,
    fetchAuditoria,
  };
};
