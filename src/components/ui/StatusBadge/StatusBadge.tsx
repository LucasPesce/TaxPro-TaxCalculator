//================= IMPORTACIONES ==================
import React from 'react';
import styles from './StatusBadge.module.css';

//============ DEFINICIÓN DE TIPOS ==============
interface StatusBadgeProps {
  status: 'Correcto' | 'Error' | 'Habilitado' | 'Inhabilitado';
}

//================== COMPONENTE ====================
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Evaluamos si el estado es de los "positivos"
  const isSuccess = status === 'Correcto' || status === 'Habilitado';

  const badgeClassName = `${styles.badge} ${isSuccess ? styles.success : styles.danger}`;

  return <span className={badgeClassName}>{status}</span>;
};