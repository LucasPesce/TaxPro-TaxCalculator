//================= IMPORTACIONES =================
import React from 'react';
import './Sidebar.css';
import logoImg from '../../../assets/images/marca.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle, CollapsedThemeToggle } from '../../ui/ThemeToggle/ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';
import { checkAccess, getCurrentUser } from '../../../utils/auth';

//================= DEFINICIÓN DE TIPOS (PROPS) =================
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

//================= COMPONENTE SIDEBAR =================
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {

    //================= LÓGICA DEL COMPONENTE =================
    const navigate = useNavigate();

    const sidebarClassName = `sidebar ${isCollapsed ? 'collapsed' : ''}`;

    const currentUser = getCurrentUser();
    const rol = currentUser?.rol;

    const handleLogout = () => {
        localStorage.removeItem('usuarioActual');
        navigate('/login', { replace: true });
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

                {/* --- MÓDULO: DASHBOARD DE CONTROL --- */}
                {checkAccess(rol, 'Dashboard') && (
                    <li className="menu-item">
                        <Link to="/app/dashboard-control"><i className="fa-solid fa-chart-line"></i><span>Control (Métricas)</span></Link>
                    </li>
                )}

                {/* --- MÓDULO: AUDITORÍA --- */}
                {checkAccess(rol, 'Auditoria') && (
                    <li className="menu-item">
                        <Link to="/app/auditoria"><i className="fa-solid fa-clipboard-list"></i><span>Auditoría</span></Link>
                    </li>
                )}

                {/* --- MÓDULO: USUARIOS --- */}
                {checkAccess(rol, 'Usuarios') && (
                    <li className="menu-item">
                        <Link to="/app/usuarios"><i className="fa-solid fa-user-shield"></i><span>Usuarios</span></Link>
                    </li>
                )}

                {/* --- MÓDULO: OPERACIONES (Trabajo Diario) --- */}
                {checkAccess(rol, 'Operaciones') && (
                    <>
                        <li className="menu-item">
                            <Link to="/app/clientes"><i className="fa-solid fa-users"></i><span>Clientes</span></Link>
                        </li>

                        <li className="menu-item"><a href="#"><i className="fa-solid fa-dolly"></i><span>Proveedores</span></a></li>
                        <li className="menu-item"><Link to="/app/iva-ventas"><i className="fa-solid fa-receipt"></i><span>IVA Ventas</span></Link></li>
                        <li className="menu-item"><Link to="/app/iva-compras"><i className="fa-solid fa-file-invoice-dollar"></i><span>IVA Compras</span></Link></li>
                        <li className="menu-item"><a href="#"><i className="fa-solid fa-landmark"></i><span>IIBB</span></a></li>
                        <li className="menu-item"><a href="#"><i className="fa-solid fa-building-flag"></i><span>Tasa Municipal</span></a></li>
                        <li className="menu-item"><a href="#"><i className="fa-solid fa-scale-balanced"></i><span>Ganancias</span></a></li>
                    </>
                )}
            </ul>

            <div className="sidebar-actions">
                <ul className="menu-options">
                    <li className="menu-item">
                        <button onClick={handleLogout} className="logout-btn">
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </li>
                </ul>
            </div>
            <div className="sidebar-footer">
                {isCollapsed ? <CollapsedThemeToggle /> : <ThemeToggle />}
            </div>
        </nav>
    );
};

export default Sidebar;