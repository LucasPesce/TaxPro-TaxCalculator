import React from 'react';

interface StatusBadgeProps {
  status: 'Correcto' | 'Error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    // La clase cambia según el estado: 'badge-success' o 'badge-danger'
    const badgeClassName = `badge ${status === 'Correcto' ? 'badge-success' : 'badge-danger'}`;
    return <span className={badgeClassName}>{status}</span>;
};