//================= IMPORTACIONES ====================
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './Input.module.css';

//============== DEFINICIÓN DE TIPOS Y PROPIEDADES ====================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

//================== COMPONENTE INPUT ====================
export const Input: React.FC<InputProps> = ({ label, id, name, type = 'text', ...props }) => {
  const inputId = id || name;
  
  // Estado para controlar si mostramos u ocultamos la contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Determinamos el tipo real del input.
  // Si era 'password', dependemos del estado showPassword. Si no, usamos el original (text, number, date...)
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    // e.preventDefault() es VITAL aquí para que el botón no intente enviar el formulario si está dentro de uno
    e.preventDefault(); 
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      
      {/* Contenedor relativo para posicionar el ícono del ojo */}
      <div className={styles.inputContainer}>
        <input
          id={inputId}
          name={name}
          type={inputType}
          className={styles.input}
          {...props}
        />
        
        {/* Renderizamos el botón del ojo SOLO si la prop type original es 'password' */}
        {type === 'password' && (
          <button 
            type="button" 
            onClick={togglePasswordVisibility} 
            className={styles.eyeButton}
            tabIndex={-1} // Evita que se seleccione con la tecla 'Tab' al navegar el formulario
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        )}
      </div>
    </div>
  );
};