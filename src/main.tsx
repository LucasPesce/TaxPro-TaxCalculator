import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme.tsx';
import App from './App.tsx'
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { IvaVentasPage } from './pages/IvaVentas/IvaVentasPage';
import './styles/global.css'

const router = createBrowserRouter([
  {
    path: "/",
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
