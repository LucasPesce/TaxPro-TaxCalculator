import React from 'react';
import styles from './Input.module.css';

// Usamos una técnica avanzada y profesional: extendemos todos los atributos
// posibles de un input HTML. Esto nos da 'name', 'type', 'placeholder', 'onChange', etc., gratis.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, name, ...props }) => {
  // Si no se provee un 'id', lo creamos a partir del 'name' para conectar la label.
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
        {...props} // Pasamos el resto de props (value, onChange, type, readOnly, etc.)
      />
    </div>
  );
};