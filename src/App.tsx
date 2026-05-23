// src/App.tsx
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar/Sidebar';
import { Button } from './components/ui/Button/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { getCurrentUser } from './utils/auth';
import './App.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prevState => !prevState);
  };

  // Obtenemos los datos del operador logueado
  const user = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('usuarioActual');
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className="main-content">

        <header className="app-header">
          <div className="user-info">
            <span className="user-name">{user ? `${user.apellido}, ${user.nombre}` : 'Operador'}</span>
            <span className="user-role">{user?.rol || 'Rol'}</span>
          </div>

          {/* Botón Salir (Mismo color Primary) */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              marginLeft: '1rem',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: 0,
              fontFamily: 'inherit',
              transition: 'opacity 0.2s'
            }}
            // Pequeño efecto hover para que se note que es clickable
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title="Cerrar Sesión"
          >
            <FontAwesomeIcon icon={faRightFromBracket} /> Cerrar Sesión
          </button>
        </header>

        {/* Las páginas se renderizan aquí con scroll independiente */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default App;