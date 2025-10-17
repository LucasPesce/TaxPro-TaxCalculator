import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.tsx';

// Importaciones de la App y la Página
import App from './App.tsx'
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { IvaVentasPage } from './pages/IvaVentas/IvaVentasPage';
import './styles/global.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // El layout principal siempre se renderiza en la raíz
    children: [
      {
        index: true, // La propiedad 'index' significa que es la ruta por defecto para el padre
        element: <DashboardPage />,
      },
      {
        path: "iva-ventas", // Cuando la URL sea /iva-ventas...
        element: <IvaVentasPage />, // ...se renderizará esta página DENTRO del <Outlet> de App
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* ESTA LÍNEA ES LA CLAVE: Usamos RouterProvider en lugar de App directamente */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
