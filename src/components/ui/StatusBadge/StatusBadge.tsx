//================= IMPORTACIONES ==================
import React from 'react';
import styles from './StatusBadge.module.css';

//============ DEFINICIÓN DE TIPOS ==============
interface StatusBadgeProps {
  status: 'Validado' | 'Observado' | 'Editado' | 'Habilitado' | 'Inhabilitado' | string;
}

//================== COMPONENTE ====================
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Evaluamos si el estado es de los "positivos"
  const isSuccess = status === 'Validado' || status === 'Habilitado' || status === 'Editado';

  const badgeClassName = `${styles.badge} ${isSuccess ? styles.success : styles.danger}`;

  return <span className={badgeClassName}>{status}</span>;
};