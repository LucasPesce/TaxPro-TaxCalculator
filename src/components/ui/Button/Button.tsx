//================= IMPORTACIONES ==================
import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';


//========== DEFINICIÓN DE TIPOS Y PROPS ===========
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'secondary' | 'fileSelect' | 'icon';
}


//================= COMPONENTE BUTTON ==================
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {

  const buttonClassName = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClassName} {...props}>
      {children}
    </button>
  );
};