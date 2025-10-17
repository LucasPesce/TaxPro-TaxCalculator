// src/components/ui/StatusBadge/StatusBadge.tsx

import React from 'react';
// 1. Importamos los nuevos estilos del módulo
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: 'Correcto' | 'Error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    // 2. Construimos el className dinámicamente
    //    - La clase base '.badge' siempre se aplica.
    //    - La clase de la variante ('.success' o '.danger') se añade según la prop 'status'.
    const badgeClassName = `
        ${styles.badge} 
        ${status === 'Correcto' ? styles.success : styles.danger}
    `;

    return <span className={badgeClassName}>{status}</span>;
};