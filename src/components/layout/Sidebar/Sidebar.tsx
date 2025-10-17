// ============== IMPORTACIONES ===============
// Importamos lo necesario de React y nuestras librerías y assets.
import React from 'react';
import './Sidebar.css';
import logoImg from '../../../assets/images/logo.png';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle, CollapsedThemeToggle } from '../../ui/ThemeToggle/ThemeToggle';
import { Link } from 'react-router-dom';

// ==============  DEFINICIÓN DE TIPOS =========
// Definimos la "interfaz" de las props que este componente espera recibir de su padre.
// Esto es TypeScript en acción: nos aseguramos de que App.tsx nos envíe los datos correctos.
interface SidebarProps {
    isCollapsed: boolean;      // Un valor que nos dice si el menú está colapsado o no.
    toggleSidebar: () => void; // Una función que se ejecutará cuando se haga clic en el botón.   
}

// ============== 3. EL COMPONENTE ===============
// Definimos nuestro componente funcional. SOLO UNA VEZ.
// Usamos React.FC<SidebarProps> para decirle que este componente usará los tipos que definimos arriba.
// Desestructuramos las props { isCollapsed, toggleSidebar } para poder usarlas directamente.
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    // COLPASAR MENU
    const sidebarClassName = `sidebar ${isCollapsed ? 'collapsed' : ''}`;

    // CERRAR SESION
    const handleLogout = () => {
        alert('Cerrando sesión...');
        console.log('Usuario ha cerrado sesión.');
    };

    return (
        <nav className={sidebarClassName}>
            <div className="sidebar-header">
                <img src={logoImg} alt="Logo TaxPro" className="logo" />
                <h1 className="logo-text">TaxPro</h1>
                <button onClick={toggleSidebar} className="menu-toggle-btn" aria-label="Alternar menú">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
            </div>

            <ul className="menu-options">
                <li className="menu-item">
                    <a href="#" data-tooltip="Clientes"><i className="fa-solid fa-users"></i><span>Clientes</span></a>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="Proveedores"><i className="fa-solid fa-dolly"></i><span>Proveedores</span></a>
                </li>
                <li className="menu-item">
                    <Link to="/iva-ventas"  data-tooltip="IVA Ventas"><i className="fa-solid fa-receipt"></i><span>IVA Ventas</span></Link>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="IVA Compras"><i className="fa-solid fa-file-invoice-dollar"></i><span>IVA Compras</span></a>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="IIBB"><i className="fa-solid fa-landmark"></i><span>IIBB</span></a>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="Tasa Munisipal"><i className="fa-solid fa-building-flag"></i><span>Tasa Municipal</span></a>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="Ganancias"><i className="fa-solid fa-scale-balanced"></i><span>Ganancias</span></a>
                </li>
            </ul>

            {/*CERRAR SESION*/}
            <div className="sidebar-actions">
                <ul className="menu-options">
                    <li className="menu-item">
                        {/* Usamos un <button> porque es una acción, no un enlace de navegación */}
                        <button onClick={handleLogout} className="logout-btn" data-tooltip="Cerrar Sesión">
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </li>
                </ul>
            </div>

            {/*PIE DE PAGINA*/}
            <div className="sidebar-footer">
                {isCollapsed ? <CollapsedThemeToggle /> : <ThemeToggle />}
            </div>
        </nav>
    );
};

// ============== 4. EXPORTACIÓN =================
// Exportamos el componente para que otros archivos, como App.tsx, puedan importarlo y usarlo.
// SOLO PUEDE HABER UN 'export default' POR ARCHIVO.
export default Sidebar;