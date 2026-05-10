import { useState, useEffect } from "react";
import { type Usuario } from "../types";

export const useUsuariosManager = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
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

  // FUNCIÓN AUXILIAR: Obtiene los datos del usuario logueado y los pone en los Headers
  const getHeaders = () => {
    const userStr = localStorage.getItem("usuarioActual");
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      "Content-Type": "application/json",
      "X-Operador-Id": user?.id?.toString() || "0",
      "X-Operador-Doc": user?.documento || "Desconocido",
      "X-Operador-Nombre": user
        ? `${user.apellido}, ${user.nombre}`
        : "Sistema",
    };
  };

  const handleCreateUsuario = async (usuarioData: Partial<Usuario>) => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(usuarioData),
      });
      if (res.ok)
        fetchUsuarios(); // Recargamos la tabla
      else {
        const err = await res.json();
        alert(err.error || "Error al crear usuario");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateUsuario = async (
    id: number,
    usuarioData: Partial<Usuario>,
  ) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(usuarioData),
      });
      if (res.ok) fetchUsuarios();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUsuario = async (id: number) => {
    if (
      !window.confirm(
        "¿Seguro que deseas inhabilitar este usuario? (Quedará en papelera por 30 días)",
      )
    )
      return;
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) fetchUsuarios();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreUsuario = async (id: number) => {
    if (!window.confirm("¿Restaurar este usuario y darle acceso nuevamente?"))
      return;
    try {
      const res = await fetch(`/api/usuarios/${id}/restaurar`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (res.ok) fetchUsuarios();
    } catch (error) {
      console.error(error);
    }
  };
  const handleForceDeleteUsuario = async (id: number) => {
    if (
      !window.confirm(
        "⚠️ ADVERTENCIA: Esta acción eliminará el usuario permanentemente y no se puede deshacer. ¿Continuar?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/usuarios/${id}/forzar`, {
        method: "DELETE",
        headers: getHeaders(),
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
    usuarios,
    handleCreateUsuario,
    handleUpdateUsuario,
    handleDeleteUsuario,
    handleRestoreUsuario,
    handleForceDeleteUsuario
  };
};
