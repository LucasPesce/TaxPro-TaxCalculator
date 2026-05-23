// src/pages/Proveedores/hooks/useProveedoresManager.ts
import { useState, useEffect, useMemo } from 'react';
import { type Proveedor } from '../types'; // Ajusta la ruta a tu types.ts

type SortKey = keyof Proveedor;
type SortDirection = "ascending" | "descending";

export const useProveedoresManager = () => {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'razonSocial',
        direction: 'ascending',
    });

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const fetchProveedores = async () => {
        try {
            const res = await fetch('/api/proveedores');
            if (res.ok) {
                const data = await res.json();
                setProveedores(data);
            }
        } catch (error) {
            console.error("Error fetching proveedores:", error);
        }
    };

    useEffect(() => {
        fetchProveedores();
    }, []);

    const getHeaders = () => {
        const userStr = localStorage.getItem('usuarioActual');
        const user = userStr ? JSON.parse(userStr) : null;
        
        return {
            'Content-Type': 'application/json',
            'X-Operador-Id': user?.id?.toString() || '0',
            'X-Operador-Doc': user?.documento || 'Desconocido',
            'X-Operador-Nombre': user ? `${user.apellido}, ${user.nombre}` : 'Sistema'
        };
    };

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    const sortedProveedores = useMemo(() => {
        const sortableItems = [...proveedores];
        sortableItems.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'activo') {
                valA = a.activo ? 1 : 0;
                valB = b.activo ? 1 : 0;
            }

            if (valA == null && valB != null) return 1;
            if (valB == null && valA != null) return -1;
            if (valA == null && valB == null) return 0;

            if ((valA as any) < (valB as any)) return sortConfig.direction === "ascending" ? -1 : 1;
            if ((valA as any) > (valB as any)) return sortConfig.direction === "ascending" ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [proveedores, sortConfig]);

    const paginatedProveedores = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedProveedores.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedProveedores, currentPage]);

    const handleCreateProveedor = async (data: Partial<Proveedor>) => {
        try {
            const res = await fetch('/api/proveedores', {
                method: 'POST',
                headers: getHeaders(), 
                body: JSON.stringify(data)
            });
            if (res.ok) fetchProveedores();
            else {
                const err = await res.json();
                alert(err.error || "Error al crear proveedor");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateProveedor = async (id: number, data: Partial<Proveedor>) => {
        try {
            const res = await fetch(`/api/proveedores/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (res.ok) fetchProveedores();
            else {
                const err = await res.json();
                alert(err.error || "Error al actualizar proveedor");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteProveedor = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas inhabilitar este proveedor?")) return;
        try {
            const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE', headers: getHeaders() });
            if (res.ok) fetchProveedores();
        } catch (error) { console.error(error); }
    };

    const handleRestoreProveedor = async (id: number) => {
        if (!window.confirm("¿Restaurar este proveedor y habilitarlo nuevamente?")) return;
        try {
            const res = await fetch(`/api/proveedores/${id}/restaurar`, { method: 'PATCH', headers: getHeaders() });
            if (res.ok) fetchProveedores();
        } catch (error) { console.error(error); }
    };


    return {
        proveedores: paginatedProveedores,
        totalProveedores: proveedores.length,
        currentPage,
        ITEMS_PER_PAGE,
        setCurrentPage,
        sortConfig,
        handleSort,
        handleCreateProveedor,
        handleUpdateProveedor,
        handleDeleteProveedor,
        handleRestoreProveedor,
    };
};