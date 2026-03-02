import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.tsx';
import App from './App.tsx'
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { IvaVentasPage } from './pages/IvaVentas/IvaVentasPage';
import './styles/global.css'
import { IvaComprasPage } from './pages/IvaCompras/IvaComprasPage'; 
import { LoginPage } from './pages/Login/LoginPage'; 

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />, 
  },
  {
    path: "/app",
    element: <App />, 
    children: [
      {
        index: true, 
        element: <DashboardPage />,
      },
      {
        path: "iva-ventas", 
        element: <IvaVentasPage />, 
      },
            {
        path: "iva-compras", 
        element: <IvaComprasPage />, 
      },
    ],
  },
  {
    path: "/", 
    element: <Navigate to="/login" replace />, 
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
