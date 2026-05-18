import { useState, useEffect, useMemo } from 'react';
import { type Cliente } from '../../src/types'; 

type SortKey = keyof Cliente;
type SortDirection = "ascending" | "descending";

export const useClientesManager = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    
    // --- ESTADO PARA ORDENAMIENTO ---
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'razonSocial',
        direction: 'ascending',
    });

    // --- ESTADO PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const fetchClientes = async () => {
        try {
            const res = await fetch('/api/clientes');
            if (res.ok) {
                const data = await res.json();
                setClientes(data);
            }
        } catch (error) {
            console.error("Error fetching clientes:", error);
        }
    };

    useEffect(() => {
        fetchClientes();
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

    const sortedClientes = useMemo(() => {
        const sortableItems = [...clientes];
        
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
    }, [clientes, sortConfig]);

    // --- APLICAR PAGINACIÓN ---
    const paginatedClientes = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedClientes.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedClientes, currentPage]);

    const handleCreateCliente = async (clienteData: Partial<Cliente>) => {
        try {
            const res = await fetch('/api/clientes', {
                method: 'POST',
                headers: getHeaders(), 
                body: JSON.stringify(clienteData)
            });
            if (res.ok) fetchClientes();
            else {
                const err = await res.json();
                alert(err.error || "Error al crear cliente");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateCliente = async (id: number, clienteData: Partial<Cliente>) => {
        try {
            const res = await fetch(`/api/clientes/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(clienteData)
            });
            if (res.ok) fetchClientes();
            else {
                const err = await res.json();
                alert(err.error || "Error al actualizar cliente");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteCliente = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas inhabilitar este cliente? (Quedará en papelera por 30 días)")) return;
        try {
            const res = await fetch(`/api/clientes/${id}`, { 
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) fetchClientes();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRestoreCliente = async (id: number) => {
        if (!window.confirm("¿Restaurar este cliente y habilitarlo nuevamente?")) return;
        try {
            const res = await fetch(`/api/clientes/${id}/restaurar`, { 
                method: 'PATCH',
                headers: getHeaders()
            });
            if (res.ok) fetchClientes();
        } catch (error) {
            console.error(error);
        }
    };

    const handleForceDeleteCliente = async (id: number) => {
        if (!window.confirm("⚠️ ADVERTENCIA: Esta acción eliminará el cliente permanentemente y no se puede deshacer. ¿Continuar?")) return;
        try {
            const res = await fetch(`/api/clientes/${id}/forzar`, { 
                method: 'DELETE',
                headers: getHeaders() 
            });
            if (res.ok) fetchClientes();
            else {
                 const err = await res.json();
                 alert(err.error || "Error al eliminar permanentemente");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return {
        clientes: paginatedClientes, // Devuelve lista cortada
        totalClientes: clientes.length, // Devuelve cantidad total
        currentPage,
        ITEMS_PER_PAGE,
        setCurrentPage,
        sortConfig,
        handleSort,
        handleCreateCliente,
        handleUpdateCliente,
        handleDeleteCliente,
        handleRestoreCliente,
        handleForceDeleteCliente
    };
};
