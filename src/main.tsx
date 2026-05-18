import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.tsx';
import App from './App.tsx'
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { IvaVentasPage } from './pages/IvaVentas/IvaVentasPage';
import './styles/global.css'
import { IvaComprasPage } from './pages/IvaCompras/IvaComprasPage';
import { UsuariosPage } from './pages/Usuarios/UsuariosPage';
import { LoginPage } from './pages/Login/LoginPage';
import { AuditoriaPage } from './pages/Auditoria/AuditoriaPage.tsx';
import { ClientesPage } from './pages/Clientes/ClientesPage.tsx';
import { checkAccess, getCurrentUser, type Modulo } from './utils/auth';

// COMPONENTE PARA PROTEGER RUTAS
const ProtectedRoute = ({ moduloAControlar }: { moduloAControlar: Modulo }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />; // No logueado -> Login

  if (!checkAccess(user.rol, moduloAControlar)) {
    // Si no tiene acceso, lo mandamos al inicio de la App
    return <Navigate to="/app" replace />;
  }

  return <Outlet />; // Si tiene permiso, renderiza la página
};

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Protegemos Operaciones (Ventas y Compras)
      {
        element: <ProtectedRoute moduloAControlar="Operaciones" />, children: [
          { path: "clientes", element: <ClientesPage /> }, // <-- AQUI
          { path: "iva-ventas", element: <IvaVentasPage /> },
          { path: "iva-compras", element: <IvaComprasPage /> },
        ]
      },

      // Protegemos Usuarios
      {
        element: <ProtectedRoute moduloAControlar="Usuarios" />, children: [
          { path: "usuarios", element: <UsuariosPage /> },
        ]
      },

      // Protegemos Auditoría
      {
        element: <ProtectedRoute moduloAControlar="Auditoria" />, children: [
          { path: "auditoria", element: <AuditoriaPage /> },
        ]
      },

      // Protegemos Dashboard de Control
      {
        element: <ProtectedRoute moduloAControlar="Dashboard" />, children: [
          { path: "dashboard-control", element: <DashboardPage /> },
        ]
      },
    ],
  },
  { path: "/", element: <Navigate to="/login" replace /> }
]);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
