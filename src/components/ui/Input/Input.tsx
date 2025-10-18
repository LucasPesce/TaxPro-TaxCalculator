//================= IMPORTACIONES ====================
import React from 'react';
import styles from './Input.module.css';

//============== DEFINICIÓN DE TIPOS Y PROPIEDADES ====================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

//================== COMPONENTE INPUT ====================
export const Input: React.FC<InputProps> = ({ label, id, name, ...props }) => {
  const inputId = id || name;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={styles.input}
        {...props}
      />
    </div>
  );
};