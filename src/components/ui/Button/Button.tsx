import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'secondary' | 'fileSelect' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary', // 'primary' será el estilo por defecto si no se especifica
  className = '',
  ...props // El resto de las props (onClick, disabled, type, etc.)
}) => {

  const buttonClassName = `${styles.button} ${styles[variant]} ${className}`;

  return (
    // Pasamos todas las props (incluyendo onClick, disabled, etc.) al elemento <button>
    <button className={buttonClassName} {...props}>
      {children}
    </button>
  );
};