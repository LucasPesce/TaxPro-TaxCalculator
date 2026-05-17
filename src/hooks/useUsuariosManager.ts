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

    // --- LÓGICA DE ORDENAMIENTO ---
    const handleSort = (key: SortKey) => {
        let direction: SortDirection = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    // Memoizamos la lista ordenada
    const sortedUsuarios = useMemo(() => {
        const sortableItems = [...usuarios];
sortableItems.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // 1. Manejo específico para el campo booleano 'activo'
            if (sortConfig.key === 'activo') {
                valA = a.activo ? 1 : 0;
                valB = b.activo ? 1 : 0;
            }

            // 2. Manejo de nulls y undefined:
            // Si valA no existe y valB sí, mandamos A al final.
            if (valA == null && valB != null) return 1;
            // Si valB no existe y valA sí, mandamos B al final.
            if (valB == null && valA != null) return -1;
            // Si ambos no existen, son iguales.
            if (valA == null && valB == null) return 0;

            // 3. Comparación segura
            // (Usamos el operador "as any" solo para calmar a TypeScript,
            // ya que hemos garantizado arriba que no son null ni undefined)
            if ((valA as any) < (valB as any)) return sortConfig.direction === "ascending" ? -1 : 1;
            if ((valA as any) > (valB as any)) return sortConfig.direction === "ascending" ? 1 : -1;
            
            return 0;
        });
        return sortableItems;
    }, [usuarios, sortConfig]);

    // --- CRUD ---
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
        if (!window.confirm("¿Seguro que deseas inhabilitar este usuario? (Quedará en papelera por 30 días)")) return;
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

    const handleForceDeleteUsuario = async (id: number) => {
        if (!window.confirm("⚠️ ADVERTENCIA: Esta acción eliminará el usuario permanentemente y no se puede deshacer. ¿Continuar?")) return;
        try {
            const res = await fetch(`/api/usuarios/${id}/forzar`, { 
                method: 'DELETE',
                headers: getHeaders() 
            });
            if (res.ok) fetchUsuarios();
            else {
                 const err = await res.json();
                 alert(err.error || "Error al eliminar permanentemente");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return {
        usuarios: sortedUsuarios, // <--- Retornamos la lista ordenada en vez de la original
        sortConfig,               // <--- Exportamos la configuración actual
        handleSort,               // <--- Exportamos la función que se dispara al hacer clic
        handleCreateUsuario,
        handleUpdateUsuario,
        handleDeleteUsuario,
        handleRestoreUsuario,
        handleForceDeleteUsuario
    };
};