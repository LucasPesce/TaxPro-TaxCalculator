# 📊 TaxPro | Plataforma de Gestión y Auditoría Fiscal

![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-orange)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-DB-003B57?logo=sqlite)

**TaxPro** es una aplicación web full-stack diseñada para simplificar y automatizar la gestión contable de IVA Compras e IVA Ventas. Desarrollado como **tesis de grado (Analista en Sistemas)**, este proyecto no solo digitaliza los procesos fiscales, sino que incorpora capas de seguridad, validación algorítmica de datos y trazabilidad de nivel empresarial.

---

## ✨ Características Principales

* **📈 Módulos de IVA Compras y Ventas:** Importación masiva desde archivos CSV de AFIP, con parsing y mapeo de datos automático.
* **🤖 Validación Inteligente de Datos:**
  * Control de IVA automático para detectar inconsistencias matemáticas.
  * Análisis de correlatividad que detecta "huecos" en la numeración de facturas y los auto-genera para su posterior edición.
* **🔐 Sistema de Seguridad (RBAC):** Control de Acceso Basado en Roles que restringe la visibilidad de módulos y el acceso a rutas según el perfil del operador (Administrador General, Supervisor, Asistente Contable, etc.).
* **✍️ Pista de Auditoría Integral:** Registro inmutable de todas las acciones críticas (Login, Creación, Edición, Inhabilitación y Restauración de usuarios; Importación de lotes, Cierre de periodos). El sistema registra autor (DNI, Nombre), timestamp y acción ejecutada.
* **🗑️ Papelera de Reciclaje de Usuarios:** Implementación de "Soft Delete". Los usuarios inhabilitados permanecen en cuarentena por 30 días antes de ser purgados permanentemente por un proceso automatizado (`node-cron`).
* **🎨 Interfaz Moderna:** Diseño limpio, funcional y responsivo. Incluye persistencia de Tema Claro/Oscuro mediante `localStorage`.

---

## 🛠️ Stack Tecnológico

**Frontend:**
* **Core:** React 19 (Vite), TypeScript.
* **Enrutamiento:** React Router.
* **Estilos:** CSS Modules (encapsulamiento estricto sin colisiones).
* **Gráficos:** Recharts para visualización en dashboards.
* **Linter:** ESLint (configuración estricta).

**Backend:**
* **Core:** Node.js, Express (API REST).
* **Base de Datos:** SQLite (ligera, ideal para el MVP y desarrollo).
* **ORM:** Prisma (acceso seguro a datos y modelado).
* **Procesos en Background:** node-cron (tareas programadas).

---

## 🚀 Instalación y Uso Local

Para ejecutar este proyecto en un entorno de desarrollo local, requieres tener Node.js instalado. Sigue estos pasos:

**1. Configurar el Servidor (Backend)**

    cd server
    npm install
    npx prisma db push
    npm run dev

*(El backend inicializará la base de datos y quedará escuchando en `http://localhost:3001`)*

**2. Configurar el Cliente (Frontend)**

Abre una nueva terminal en la raíz del proyecto y ejecuta:

    npm install
    npm run dev

*(El frontend estará disponible en `http://localhost:5173`)*

---

## 🔑 Credenciales de Acceso (Prueba)

Una vez que ambos servidores estén corriendo, abre tu navegador en la URL del cliente para ver la pantalla de login. Puedes utilizar las siguientes credenciales con privilegios máximos:

* **Usuario:** `administrador`
* **Contraseña:** `1234`

*(Nota: Este usuario posee el rol de Administrador General. Puedes crear perfiles adicionales desde la sección "Gestión de Usuarios").*

---

## 🔮 Roadmap y Próximas Mejoras

- [ ] Implementar módulos de liquidación de IIBB y Ganancias.
- [ ] Desarrollar dashboards analíticos para Supervisores y Gerentes.
- [ ] Refactorizar la gestión del estado global con TanStack Query para optimizar el cacheo.
- [ ] Migrar la autenticación a JWT reales (JSON Web Tokens) y hashing con bcrypt.
- [ ] Cobertura de código con tests unitarios y de integración.

---
*Desarrollado con dedicación para la Tesis Final de Grado.*
