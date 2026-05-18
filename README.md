TaxPro: Plataforma de Gestión y Auditoría Fiscal
TaxPro es una aplicación web full-stack diseñada para simplificar y automatizar la gestión contable de IVA Compras e IVA Ventas. Este proyecto, desarrollado como tesis de grado, no solo digitaliza los procesos fiscales, sino que incorpora capas de seguridad, validación de datos y trazabilidad de nivel empresarial.
🚧 Estado del Proyecto: En Desarrollo Activo (WIP)
✨ Características Principales
📈 Módulos de IVA Compras y Ventas: Importación masiva desde archivos CSV de AFIP, con parsing y mapeo de datos automático.
🤖 Validación Inteligente de Datos:
Control de IVA automático para detectar inconsistencias matemáticas.
Análisis de correlatividad que detecta "huecos" en la numeración de facturas y los auto-genera para su posterior edición.
🔐 Sistema de Seguridad (RBAC):
Control de Acceso Basado en Roles que restringe la visibilidad de módulos y el acceso a rutas según el perfil del operador (Administrador General, Supervisor, Asistente Contable, etc.).
✍️ Pista de Auditoría Integral:
Registro inmutable de todas las acciones críticas: Login, Creación, Edición, Inhabilitación y Restauración de usuarios; Importación de lotes, Cierre de periodos, etc.
El sistema registra qué usuario (DNI, Nombre), cuándo y qué acción realizó.
🗑️ Papelera de Reciclaje de Usuarios:
Implementación de "Soft Delete". Los usuarios eliminados permanecen inhabilitados por 30 días antes de ser borrados permanentemente por un proceso automático (node-cron).
🎨 Interfaz Moderna y Personalizable:
Diseño limpio y funcional.
Tema Claro y Oscuro con persistencia en localStorage.
🛠️ Stack Tecnológico
Este proyecto fue construido utilizando un stack moderno y escalable:
Frontend
React 19 con Vite
TypeScript para un tipado seguro.
React Router para la gestión de rutas.
CSS Modules para estilos encapsulados y sin colisiones.
Recharts para visualización de datos en dashboards.
ESLint con configuración estricta.
Backend
Node.js con Express para la API REST.
Prisma ORM como capa de acceso a la base de datos, garantizando seguridad y facilidad de consulta.
SQLite como base de datos (ligera y perfecta para desarrollo y despliegues simples).
node-cron para la ejecución de tareas programadas (limpieza automática de usuarios).
🚀 Cómo Empezar
Para ejecutar este proyecto de forma local, necesitarás tener Node.js instalado.
1. Configurar el Backend (Servidor)
code
Bash
# Navega a la carpeta del servidor
cd server

# Instala las dependencias
npm install

# Inicializa y sincroniza la base de datos SQLite con el esquema de Prisma
npx prisma db push

# Inicia el servidor de desarrollo (correrá en http://localhost:3001)
npm run dev
2. Configurar el Frontend (Cliente)
code
Bash
# (Desde la raíz del proyecto, no dentro de 'server')
# Instala las dependencias
npm install

# Inicia la aplicación de React con Vite (correrá en http://localhost:5173)
npm run dev
Una vez que ambos servidores estén corriendo, abre tu navegador en http://localhost:5173 para ver la pantalla de login.
🔑 Credenciales de Prueba
Para facilitar el acceso durante el desarrollo, puedes usar las siguientes credenciales:
Usuario: administrador
Contraseña: 1234
Este usuario tiene el rol de Administrador General y puede acceder a todos los módulos del sistema. También puedes crear nuevos usuarios con diferentes roles desde la sección "Gestión de Usuarios".

🔮 Próximos Pasos y Futuras Mejoras:

Implementar módulos de Clientes, Provedores, IIBB y Ganancias.

Desarrollar los dashboards de métricas para Supervisores y Gerentes.

Refactorizar la lógica de estado del frontend con una librería como TanStack Query para optimizar el cacheo de datos.

Implementar autenticación real con JWT (JSON Web Tokens) y hashing de contraseñas (bcrypt).

Añadir tests unitarios e de integración.
