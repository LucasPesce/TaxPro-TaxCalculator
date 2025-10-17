import React, { type ReactNode, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'fileSelect' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  as?: 'button' | 'label' | 'a';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary', // 'primary' será la variante por defecto si no se especifica otra
  className = '',
  ...props // El resto de las props (onClick, disabled, type, etc.) se agrupan en 'props'
}) => {
  
  const buttonClassName = `${styles.button} ${styles[variant]} ${className}`;

  return (
    <button className={buttonClassName} {...props}>
      {children}
    </button>
  );
};