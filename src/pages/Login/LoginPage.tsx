// src/pages/Login/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import logoImg from '../../assets/images/marca.png'; // Asegúrate de que la ruta sea correcta
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados para los campos
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);


    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Limpiamos errores previos

        // 1. Validación de campos vacíos
        if (!username || !password) {
            setError("Por favor, complete usuario y contraseña.");
            return;
        }

        // 2. Simulación de validación contra base de datos (Hardcoded por ahora)
        // Usuario: administrador | Pass: 1234
        if (username === 'administrador' && password === '1234') {
            console.log("Login exitoso");
            // Aquí en el futuro guardaríamos el token o datos de sesión
            navigate('/app');
        } else {
            // 3. Error de credenciales incorrectas
            setError("Usuario o contraseña incorrectos.");
        }
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        if (error) setError(null);
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        // A futuro: Redirigir a pantalla de recuperación o abrir modal
        alert("Funcionalidad en desarrollo: Se enviará un correo al email asociado al DNI del usuario.");
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                
                <div className={styles.logoSection}>
                    <img src={logoImg} alt="TaxPro Logo" className={styles.logo} />
                    <h2 className={styles.title}>Bienvenido</h2>
                    <p className={styles.subtitle}>Inicia sesión para gestionar tus impuestos</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    
                    {/* Mensaje de Error INLINE (Arriba de los inputs) */}
                    {error && (
                        <div className={styles.errorMessage}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                            <span>{error}</span>
                        </div>
                    )}

                    <Input 
                        label="Usuario" 
                        placeholder="Ingresa tu usuario"
                        value={username}
                        onChange={(e) => handleInputChange(setUsername, e.target.value)}
                        // Si hay error, podríamos poner el borde rojo al input, 
                        // pero por ahora el mensaje superior es suficiente.
                    />
                    
                    <Input 
                        label="Contraseña" 
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => handleInputChange(setPassword, e.target.value)}
                    />

                    <Button type="submit" variant="primary" className={styles.submitButton}>
                        Ingresar
                    </Button>
                </form>

                <a href="#" onClick={handleForgotPassword} className={styles.forgotPassword}>
                    ¿Olvidaste tu contraseña?
                </a>

            </div>
        </div>
    );
};
