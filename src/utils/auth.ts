export type RolUsuario = 
  | 'Administrador de Usuarios'
  | 'Asistente Contable'
  | 'Supervisor'
  | 'Gerente'
  | 'Administrador General';

export type Modulo = 'Usuarios' | 'Auditoria' | 'Dashboard';
export type Accion = 'Liquidar' | 'EliminarProceso' | 'CargarDatos';

export const checkAccess = (rol: string | undefined, modulo: Modulo): boolean => {
  if (rol === 'Administrador General') return true; // El Admin Gral ve TODO

  switch (modulo) {
    case 'Usuarios':
      // Solo Admin de Usuarios y Gerente
      return ['Asistente Contable', 'Supervisor', 'Gerente'].includes(rol as string);
      
    case 'Auditoria':
      // Solo Supervisor
      return ['Supervisor'].includes(rol as string);
      
    case 'Dashboard':
      // Supervisor y Gerente
      return ['Gerente'].includes(rol as string);
            
    default:
      return false;
  }
};

export const checkAction = (rol: string | undefined, accion: Accion): boolean => {
  if (rol === 'Administrador General') return true;

  switch (accion) {
    case 'CargarDatos':
      return ['Asistente Contable', 'Supervisor'].includes(rol as string);
      
    case 'Liquidar':
      return ['Supervisor'].includes(rol as string);
      
    case 'EliminarProceso':
      return ['Gerente'].includes(rol as string);

    default:
      return false;
  }
}

// Función para obtener el usuario actual del LocalStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('usuarioActual');
  return userStr ? JSON.parse(userStr) : null;
};