// src/components/ui/Select/Select.tsx

import React, { type ReactNode } from 'react';
import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode; // 'children' será para las etiquetas <option>
}

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