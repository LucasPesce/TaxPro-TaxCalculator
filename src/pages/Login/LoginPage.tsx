import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import logoImg from '../../assets/images/marca.png'; 
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();

    // Estados del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Función unificada para manejar el login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Limpiamos errores previos

        // 1. Validación de campos vacíos
        if (!username || !password) {
            setError("Por favor, complete usuario y contraseña.");
            return;
        }

        // =========================================================================
        // 🚨 ACCESO PROVISORIO HARDCODED (PUERTA TRASERA PARA DESARROLLO) 🚨
        // =========================================================================
        if (username === 'administrador' && password === '1234') {
            console.log("Login exitoso mediante acceso provisorio (Hardcoded)");
            
            // Simulamos los datos del usuario administrador
            const adminUser = {
                id: 0,
                nombre: "Administrador",
                apellido: "Sistema",
                username: "administrador",
                rol: "Administrador",
                email: "admin@taxpro.com"
            };
            
            localStorage.setItem('usuarioActual', JSON.stringify(adminUser));
            navigate('/app', { replace: true });
            return; // Detenemos la ejecución aquí para no ir a la BD
        }
        // =========================================================================

        // 2. Si no es el administrador hardcoded, vamos a la BASE DE DATOS REAL
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            // 3. Si el servidor dice OK (código 200)
            if (response.ok) {
                console.log("Login exitoso contra BD. Bienvenido:", data.usuario.nombre);
                
                // Guardamos los datos del usuario
                localStorage.setItem('usuarioActual', JSON.stringify(data.usuario));
                
                // Redirigimos a la app
                navigate('/app', { replace: true });
            } else {
                // 4. Error de credenciales en BD o usuario inhabilitado
                setError(data.error || "Ocurrió un error al iniciar sesión.");
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            setError("Error de conexión con el servidor. Verifica que el backend esté encendido.");
        }
    };

    // Limpia el error apenas el usuario empieza a escribir
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        if (error) setError(null);
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        alert("Funcionalidad en desarrollo: Se enviará un correo al email asociado al usuario.");
    };
    

    // =========================================================================
        // ACCESO PROVISORIO HARDCODED (PUERTA TRASERA PARA DESARROLLO) 🚨
        // =========================================================================
        if (username === 'administrador' && password === '1234') {
            console.log("Login exitoso mediante acceso provisorio (Hardcoded)");
            
            // Simulamos los datos del usuario administrador (CON TODOS LOS PERMISOS)
            const adminUser = {
                id: 0,
                documento: "00000000", // <-- Agregamos DNI falso para que no falle la auditoría
                nombre: "Administrador",
                apellido: "Sistema",
                username: "administrador",
                rol: "Administrador General", // <--- EL CAMBIO CLAVE (Antes decía solo "Administrador")
            };
            
            localStorage.setItem('usuarioActual', JSON.stringify(adminUser));
            navigate('/app', { replace: true });
            return; 
        }
        // =========================================================================


    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                
                <div className={styles.logoSection}>
                    <img src={logoImg} alt="TaxPro Logo" className={styles.logo} />
                    <h2 className={styles.title}>Bienvenido</h2>
                    <p className={styles.subtitle}>Inicia sesión para gestionar tus impuestos</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    
                    {/* Mensaje de Error INLINE */}
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