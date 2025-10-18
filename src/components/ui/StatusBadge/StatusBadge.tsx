//================= IMPORTACIONES ==================
import React from 'react';
import styles from './StatusBadge.module.css';

//============ DEFINICIÓN DE TIPOS ==============
interface StatusBadgeProps {
  status: 'Correcto' | 'Error';
}

//================== COMPONENTE ====================
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeClassName = `${styles.badge} ${status === 'Correcto' ? styles.success : styles.danger}`;

  return <span className={badgeClassName}>{status}</span>;
};