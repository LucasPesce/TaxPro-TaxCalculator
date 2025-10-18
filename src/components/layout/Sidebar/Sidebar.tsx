//================= IMPORTACIONES =================
import React from 'react';
import './Sidebar.css';
import logoImg from '../../../assets/images/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle, CollapsedThemeToggle } from '../../ui/ThemeToggle/ThemeToggle';
import { Link } from 'react-router-dom';

//================= DEFINICIÓN DE TIPOS (PROPS) =================
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

//================= COMPONENTE SIDEBAR =================
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {

    //================= LÓGICA DEL COMPONENTE =================
    const sidebarClassName = `sidebar ${isCollapsed ? 'collapsed' : ''}`;

    const handleLogout = () => {
        alert('Cerrando sesión...');
        console.log('Usuario ha cerrado sesión.');
    };

    //================= RENDERIZADO DEL COMPONENTE (JSX) =================
    return (
        <nav className={sidebarClassName}>

            {/* ----- Encabezado con Logo y Botón de Menú ----- */}
            <div className="sidebar-header">
                <img src={logoImg} alt="Logo TaxPro" className="logo" />
                <h1 className="logo-text">TaxPro</h1>
                <button onClick={toggleSidebar} className="menu-toggle-btn" aria-label="Alternar menú">
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
            </div>

            {/* ----- Menú de Navegación Principal ----- */}
            <ul className="menu-options">
                <li className="menu-item">
                    <a href="#" data-tooltip="Clientes"><i className="fa-solid fa-users"></i><span>Clientes</span></a>
                </li>
                <li className="menu-item">
                    <a href="#" data-tooltip="Proveedores"><i className="fa-solid fa-dolly"></i><span>Proveedores</span></a>
                </li>
                <li className="menu-item">
                    <Link to="/iva-ventas" data-tooltip="IVA Ventas"><i className="fa-solid fa-receipt"></i><span>IVA Ventas</span></Link>
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

            {/* ----- Sección de Acciones (Cerrar Sesión) ----- */}
            <div className="sidebar-actions">
                <ul className="menu-options">
                    <li className="menu-item">
                        <button onClick={handleLogout} className="logout-btn" data-tooltip="Cerrar Sesión">
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </li>
                </ul>
            </div>

            {/* ----- Pie de Página (Selector de Tema) ----- */}
            <div className="sidebar-footer">
                {isCollapsed ? <CollapsedThemeToggle /> : <ThemeToggle />}
            </div>
        </nav>
    );
};

//================= EXPORTACIÓN DEL COMPONENTE =================
export default Sidebar;