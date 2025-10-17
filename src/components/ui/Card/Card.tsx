// ============== 1. IMPORTACIONES ===============
import React, { type ReactNode } from 'react';
import styles from './Card.module.css';

// ============== 2. DEFINICIÓN DE PROPS (LA INTERFAZ) ===============
interface CardProps {

  children: ReactNode;
  title?: string;
  className?: string;
}

// ============== 3. EL COMPONENTE ===============
export const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {

  const cardClassName = `${styles.card} ${className}`;

  return (
    <div className={cardClassName}>
      {title && (
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </header>
      )}

      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};