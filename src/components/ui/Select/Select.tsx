//================ IMPORTACIONES ====================
import React, { type ReactNode } from 'react';
import styles from './Select.module.css';

//================ INTERFAZ DE PROPS ====================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

//================ COMPONENTE SELECT ====================
export const Select: React.FC<SelectProps> = ({ label, id, name, children, ...props }) => {
  const selectId = id || name;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        className={styles.select}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};