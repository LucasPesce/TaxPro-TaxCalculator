import { useState, useEffect, useMemo } from 'react';
import { type Usuario } from '../types';

type SortKey = keyof Usuario;
type SortDirection = "ascending" | "descending";

export const useUsuariosManager = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    
    // --- ESTADO PARA ORDENAMIENTO ---
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'apellido',
        direction: 'ascending',
    });

    // --- ESTADO PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5; // Cantidad de filas por página

    const fetchUsuarios = async () => {
        try {
            const res = await fetch('/api/usuarios');
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            }
        } catch (error) {
            console.error("Error fetching usuarios:", error);
        }
    };

    useEffect(() => {
        fetchUsuarios();
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

    const sortedUsuarios = useMemo(() => {
        const sortableItems = [...usuarios];
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
    }, [usuarios, sortConfig]);

    // --- APLICAR PAGINACIÓN ---
    const paginatedUsuarios = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedUsuarios.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedUsuarios, currentPage]);

    const handleCreateUsuario = async (usuarioData: Partial<Usuario>) => {
        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: getHeaders(), 
                body: JSON.stringify(usuarioData)
            });
            if (res.ok) fetchUsuarios();
            else {
                const err = await res.json();
                alert(err.error || "Error al crear usuario");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateUsuario = async (id: number, usuarioData: Partial<Usuario>) => {
        try {
            const res = await fetch(`/api/usuarios/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(usuarioData)
            });
            if (res.ok) fetchUsuarios();
            else {
                const err = await res.json();
                alert(err.error || "Error al actualizar usuario");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUsuario = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas inhabilitar este usuario?")) return;
        try {
            const res = await fetch(`/api/usuarios/${id}`, { 
                method: 'DELETE',
                headers: getHeaders()
            });
            if (res.ok) fetchUsuarios();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRestoreUsuario = async (id: number) => {
        if (!window.confirm("¿Restaurar este usuario y darle acceso nuevamente?")) return;
        try {
            const res = await fetch(`/api/usuarios/${id}/restaurar`, { 
                method: 'PATCH',
                headers: getHeaders()
            });
            if (res.ok) fetchUsuarios();
        } catch (error) {
            console.error(error);
        }
    };

    return {
        usuarios: paginatedUsuarios, // Devolvemos la lista recortada para la página actual
        totalUsuarios: usuarios.length, // Enviamos el total para que la paginación sepa cuántos botones dibujar
        currentPage,
        ITEMS_PER_PAGE,
        setCurrentPage,
        sortConfig,               
        handleSort,               
        handleCreateUsuario,
        handleUpdateUsuario,
        handleDeleteUsuario,
        handleRestoreUsuario,
    };
};