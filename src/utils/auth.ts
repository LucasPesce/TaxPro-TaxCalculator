// src/utils/auth.ts
export type RolUsuario = 
  | 'Administrador de Usuarios'
  | 'Asistente Contable'
  | 'Supervisor'
  | 'Gerente'
  | 'Administrador General';

export type Modulo = 'Usuarios' | 'Auditoria' | 'Dashboard' | 'Operaciones';

export const checkAccess = (rol: string | undefined, modulo: Modulo): boolean => {
  if (rol === 'Administrador General') return true; // El Admin Gral ve TODO

  switch (modulo) {
    case 'Usuarios':
      // Solo Admin de Usuarios y Gerente
      return ['Administrador de Usuarios', 'Gerente'].includes(rol as string);
      
    case 'Auditoria':
      // Solo Supervisor
      return ['Supervisor'].includes(rol as string);
      
    case 'Dashboard':
      // Supervisor y Gerente
      return ['Supervisor', 'Gerente'].includes(rol as string);
      
    case 'Operaciones':
      // Son las facturas, clientes, iibb. Acceden todos MENOS el Admin de Usuarios
      return ['Asistente Contable', 'Supervisor', 'Gerente'].includes(rol as string);
      
    default:
      return false;
  }
};

// Función para obtener el usuario actual del LocalStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('usuarioActual');
  return userStr ? JSON.parse(userStr) : null;
};