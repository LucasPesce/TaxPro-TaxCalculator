// server/index.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==================================================================
// =================== FUNCIÓN DE AUDITORÍA GENERAL =================
// ==================================================================
const registrarActividad = async (
  req: any,
  accion: string,
  entidadAfectada: string,
  entidadId: number,
  detalles: string,
) => {
  const operadorId = parseInt(req.header("X-Operador-Id") || "0", 10);
  const operadorDoc = req.header("X-Operador-Doc") || "Desconocido";
  const operadorNombre = req.header("X-Operador-Nombre") || "Sistema";

  await prisma.registroActividad.create({
    data: {
      operadorId,
      operadorDoc,
      operadorNombre,
      accion,
      entidadAfectada,
      entidadId, // Si es un lote masivo, enviamos 0
      detalles,
    },
  });
};

// ==================================================================
// ======================== MÓDULO IVA VENTAS =======================
// ==================================================================

app.get("/api/facturas", async (req, res) => {
  const { search, period } = req.query;
  try {
    const whereClause: any = { AND: [] };

    if (search) {
      const searchTerm = String(search);
      whereClause.AND.push({
        OR: [
          { nombreEmpresa: { contains: searchTerm } },
          { cuitCliente: { contains: searchTerm } },
        ],
      });
    }

    if (period) {
      const [year, month] = String(period).split("-");
      const searchString = `/${month}/${year}`;
      whereClause.AND.push({ fecha: { endsWith: searchString } });
    }

    const facturas = await prisma.facturaVenta.findMany({
      where: whereClause,
      orderBy: { numeroFactura: "asc" },
    });

    res.json(facturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener las facturas" });
  }
});

// --- IMPORTACIÓN LOTES VENTAS (OPTIMIZADO) ---
app.post("/api/facturas/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa } = req.body;

  if (!invoices || !Array.isArray(invoices)) {
    return res.status(400).json({ error: "Se esperaba un array de facturas." });
  }

  try {
    const cuitActual = String(cuitEmpresa);
    let facturasInsertadas = 0;

    for (const f of invoices) {
      const existe = await prisma.facturaVenta.findFirst({
        where: { cuitCliente: cuitActual, numeroFactura: f.nro },
      });

      if (!existe) {
        await prisma.facturaVenta.create({
          data: {
            cuitCliente: cuitActual,
            nombreEmpresa: String(nombreEmpresa),
            cliente: f.cliente,
            condicionIva: f.condicionIva || f.condIva,
            tipoDocumento: f.doc,
            numeroDocumento: f.docNumero,
            fecha: f.fecha,
            numeroFactura: f.nro,
            montoGravado: f.montoGravado,
            iva21: f.iva21,
            percIIBB: f.percIIBB,
            percMun: f.percMun,
            total: f.total,
            provincia: f.provincia,
          },
        });
        facturasInsertadas++;
      }
    }

    // 🚨 AUDITORÍA SINTETIZADA: Solo 1 registro por la importación completa
    if (facturasInsertadas > 0) {
      await registrarActividad(
        req,
        "IMPORTACIÓN MASIVA",
        "Lote Ventas",
        0,
        `Se importaron ${facturasInsertadas} facturas de venta para el CUIT ${cuitActual}`,
      );
    }

    const facturasAnalisis = await prisma.facturaVenta.findMany({
      where: { cuitCliente: cuitActual },
      orderBy: { numeroFactura: "asc" },
    });

    const gruposSeries: Record<string, typeof facturasAnalisis> = {};

    facturasAnalisis.forEach((f) => {
      if (!f.numeroFactura || !f.numeroFactura.includes("-")) return;
      const [ptVenta] = f.numeroFactura.split("-");
      const tipoDoc = f.tipoDocumento ? f.tipoDocumento.trim() : "Desconocido";
      const claveGrupo = `${ptVenta}|${tipoDoc}`;
      if (!gruposSeries[claveGrupo]) gruposSeries[claveGrupo] = [];
      gruposSeries[claveGrupo].push(f);
    });

    let huecosGenerados = 0;

    for (const clave in gruposSeries) {
      const facturasDelGrupo = gruposSeries[clave];
      const [ptVenta, tipoDocSerie] = clave.split("|");

      const numerosOrdenados = facturasDelGrupo
        .map((f) => ({
          numero: parseInt(f.numeroFactura.split("-")[1]),
          original: f,
        }))
        .sort((a, b) => a.numero - b.numero);

      if (numerosOrdenados.length > 1) {
        for (let i = 0; i < numerosOrdenados.length - 1; i++) {
          const actual = numerosOrdenados[i].numero;
          const siguiente = numerosOrdenados[i + 1].numero;

          if (siguiente > actual + 1) {
            for (let j = actual + 1; j < siguiente; j++) {
              const numeroFaltanteStr = String(j).padStart(8, "0");
              const nroCompleto = `${ptVenta}-${numeroFaltanteStr}`;

              const existeHueco = await prisma.facturaVenta.findFirst({
                where: { cuitCliente: cuitActual, numeroFactura: nroCompleto },
              });

              if (!existeHueco) {
                await prisma.facturaVenta.create({
                  data: {
                    cuitCliente: cuitActual,
                    nombreEmpresa: String(nombreEmpresa),
                    cliente: "--- FACTURA FALTANTE ---",
                    condicionIva: "Consumidor Final",
                    tipoDocumento: tipoDocSerie,
                    numeroDocumento: 0,
                    fecha: "",
                    numeroFactura: nroCompleto,
                    montoGravado: 0,
                    iva21: 0,
                    percIIBB: 0,
                    percMun: 0,
                    total: 0,
                    provincia: "Sin definir",
                  },
                });
                huecosGenerados++;
              }
            }
          }
        }
      }
    }

    // 🚨 AUDITORÍA SINTETIZADA DE HUECOS
    if (huecosGenerados > 0) {
      await registrarActividad(
        req,
        "AUTO-CREACIÓN",
        "Lote Ventas",
        0,
        `El sistema generó ${huecosGenerados} registros faltantes por correlatividad para el CUIT ${cuitActual}`,
      );
    }

    const facturasDelCliente = await prisma.facturaVenta.findMany({
      where: { cuitCliente: cuitActual },
      orderBy: { numeroFactura: "asc" },
    });
    res.status(201).json(facturasDelCliente);
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "Error al procesar el lote" });
  }
});

app.put("/api/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const datos = req.body;

  try {
    const facturaActualizada = await prisma.facturaVenta.update({
      where: { id: id },
      data: {
        cliente: datos.cliente,
        condicionIva: datos.condIva,
        tipoDocumento: datos.doc,
        numeroDocumento: datos.docNumero,
        fecha: datos.fecha,
        montoGravado: datos.montoGravado,
        iva21: datos.iva21,
        percIIBB: datos.percIIBB,
        percMun: datos.percMun,
        total: datos.total,
        provincia: datos.provincia,
      },
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "FacturaVenta",
      id,
      `Se editó la factura de venta: ${facturaActualizada.numeroFactura} (CUIT: ${facturaActualizada.cuitCliente})`,
    );

    res.json(facturaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error al actualizar la factura ${id}` });
  }
});

// ==================================================================
// ======================== MÓDULO IVA COMPRAS ======================
// ==================================================================

app.get("/api/compras", async (req, res) => {
  const { search, period } = req.query;
  try {
    const whereClause: any = { AND: [] };

    if (search) {
      const term = String(search);
      whereClause.AND.push({
        OR: [
          { nombreEmpresa: { contains: term } },
          { cuitEmpresa: { contains: term } },
        ],
      });
    }
    if (period) {
      const [year, month] = String(period).split("-");
      const searchString = `/${month}/${year}`;
      whereClause.AND.push({ fechaImputacion: { endsWith: searchString } });
    }

    const compras = await prisma.facturaCompra.findMany({
      where: whereClause,
      orderBy: { fechaImputacion: "asc" },
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener compras" });
  }
});

// --- IMPORTACIÓN LOTES COMPRAS (OPTIMIZADO) ---
app.post("/api/compras/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa } = req.body;

  if (!invoices || !Array.isArray(invoices))
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const cuitActual = String(cuitEmpresa);
    let comprasInsertadas = 0;

    for (const f of invoices) {
      const existe = await prisma.facturaCompra.findFirst({
        where: {
          cuitEmpresa: cuitActual,
          cuitProveedor: f.cuitProveedor,
          numeroFactura: f.nro,
        },
      });

      if (!existe) {
        await prisma.facturaCompra.create({
          data: {
            cuitEmpresa: cuitActual,
            nombreEmpresa: String(nombreEmpresa),
            proveedor: f.proveedor,
            cuitProveedor: f.cuitProveedor,
            condicionIva: f.condicionIva,
            tipoDocumento: f.doc,
            numeroFactura: f.nro,
            fechaEmision: f.fechaEmision,
            fechaImputacion: f.fechaImputacion,
            provincia: f.provincia,
            jurisdiccion: f.jurisdiccion,
            clasificacion: f.clasificacion || "Sin Clasificar",
            montoGravado: f.montoGravado || 0,
            exento: f.exento || 0,
            percIva: f.percIva || 0,
            percIIBB: f.percIIBB || 0,
            percMun: f.percMun || 0,
            ganancias: f.ganancias || 0,
            iva27: f.iva27 || 0,
            iva21: f.iva21 || 0,
            iva105: f.iva105 || 0,
            otrasRetenciones: f.otrasRetenciones || 0,
            total: f.total || 0,
          },
        });
        comprasInsertadas++;
      }
    }

    // 🚨 AUDITORÍA SINTETIZADA
    if (comprasInsertadas > 0) {
      await registrarActividad(
        req,
        "IMPORTACIÓN MASIVA",
        "Lote Compras",
        0,
        `Se importaron ${comprasInsertadas} facturas de compra para el CUIT ${cuitActual}`,
      );
    }

    const comprasDelCliente = await prisma.facturaCompra.findMany({
      where: { cuitEmpresa: cuitActual },
      orderBy: { fechaImputacion: "asc" },
    });
    res.status(201).json(comprasDelCliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando compras" });
  }
});

app.post("/api/compras", async (req, res) => {
  const f = req.body;
  const cuitActual = f.cuitEmpresa;

  try {
    const nueva = await prisma.facturaCompra.create({
      data: {
        cuitEmpresa: cuitActual,
        nombreEmpresa: f.nombreEmpresa,
        proveedor: f.proveedor,
        cuitProveedor: f.cuitProveedor,
        condicionIva: f.condicionIva,
        tipoDocumento: f.doc,
        numeroFactura: f.nro,
        fechaEmision: f.fechaEmision,
        fechaImputacion: f.fechaImputacion,
        provincia: f.provincia,
        jurisdiccion: f.jurisdiccion,
        clasificacion: f.clasificacion,
        montoGravado: parseFloat(f.montoGravado) || 0,
        exento: parseFloat(f.exento) || 0,
        percIva: parseFloat(f.percIva) || 0,
        percIIBB: parseFloat(f.percIIBB) || 0,
        percMun: parseFloat(f.percMun) || 0,
        ganancias: parseFloat(f.ganancias) || 0,
        iva27: parseFloat(f.iva27) || 0,
        iva21: parseFloat(f.iva21) || 0,
        iva105: parseFloat(f.iva105) || 0,
        otrasRetenciones: parseFloat(f.otrasRetenciones) || 0,
        total: parseFloat(f.total) || 0,
      },
    });

    await registrarActividad(
      req,
      "CREACIÓN",
      "FacturaCompra",
      nueva.id,
      `Alta manual de compra: ${f.nro} (CUIT Empresa: ${cuitActual})`,
    );

    res.json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando compra" });
  }
});

app.put("/api/compras/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const datos = req.body;

  try {
    const actualizada = await prisma.facturaCompra.update({
      where: { id },
      data: {
        proveedor: datos.proveedor,
        cuitProveedor: datos.cuitProveedor,
        fechaImputacion: datos.fechaImputacion,
        tipoDocumento: datos.doc,
        numeroFactura: datos.nro,
        clasificacion: datos.clasificacion,
        montoGravado: parseFloat(datos.montoGravado) || 0,
        exento: parseFloat(datos.exento) || 0,
        percIva: parseFloat(datos.percIva) || 0,
        percIIBB: parseFloat(datos.percIIBB) || 0,
        percMun: parseFloat(datos.percMun) || 0,
        ganancias: parseFloat(datos.ganancias) || 0,
        iva27: parseFloat(datos.iva27) || 0,
        iva21: parseFloat(datos.iva21) || 0,
        iva105: parseFloat(datos.iva105) || 0,
        otrasRetenciones: parseFloat(datos.otrasRetenciones) || 0,
        total: parseFloat(datos.total) || 0,
      },
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "FacturaCompra",
      id,
      `Se editó la compra: ${actualizada.numeroFactura} (CUIT Empresa: ${actualizada.cuitEmpresa})`,
    );

    res.json(actualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando compra" });
  }
});

// --- RUTA COMPARTIDA: IMPACTAR (COMPRAS Y VENTAS) (OPTIMIZADO) ---
app.post("/api/facturas/impactar", async (req, res) => {
  const { cuitEmpresa, periodo, tipoOperacion } = req.body;

  try {
    const [year, month] = String(periodo).split("-");
    const searchString = `/${month}/${year}`;

    let facturasAImpactar: any[] = [];
    const esCompra = tipoOperacion === "IVA Compras";

    if (esCompra) {
      facturasAImpactar = await prisma.facturaCompra.findMany({
        where: {
          cuitEmpresa: String(cuitEmpresa),
          fechaImputacion: { endsWith: searchString },
        },
      });
    } else {
      facturasAImpactar = await prisma.facturaVenta.findMany({
        where: {
          cuitCliente: String(cuitEmpresa),
          fecha: { endsWith: searchString },
        },
      });
    }

    if (facturasAImpactar.length === 0) {
      return res.status(404).json({
        message: "No hay comprobantes para impactar en este periodo.",
      });
    }

    // 🚨 AUDITORÍA SINTETIZADA: 1 solo registro por el cierre del periodo
    await registrarActividad(
      req,
      "IMPACTO (CIERRE)",
      esCompra ? "Lote Compras" : "Lote Ventas",
      0,
      `Se cerró e impactó el periodo ${periodo} de ${esCompra ? "Compras" : "Ventas"} para el CUIT ${cuitEmpresa}. Total registros: ${facturasAImpactar.length}`,
    );

    res.json({
      message: "Proceso impactado correctamente",
      cantidad: facturasAImpactar.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al impactar datos" });
  }
});

// ==================================================================
// ======================== MÓDULO USUARIOS =========================
// ==================================================================

app.get("/api/usuarios", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { apellido: "asc" },
    });

    const usuariosSeguros = usuarios.map((u) => ({
      ...u,
      password: "••••••••",
    }));

    res.json(usuariosSeguros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/api/usuarios", async (req, res) => {
  const { documento, nombre, apellido, username, password, rol } = req.body;
  try {
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        documento,
        nombre,
        apellido,
        username,
        password,
        rol,
        activo: true,
      },
    });

    await registrarActividad(
      req,
      "CREACIÓN",
      "Usuario",
      nuevoUsuario.id,
      `Se creó el usuario: ${username} con rol ${rol}`,
    );

    res.status(201).json(nuevoUsuario);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "El nombre de usuario o el Documento ya están registrados.",
      });
    }
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

app.put("/api/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { documento, nombre, apellido, username, rol, password } = req.body;

  try {
    const dataToUpdate: any = { documento, nombre, apellido, username, rol };
    if (password && password !== "••••••••") {
      dataToUpdate.password = password;
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "Usuario",
      id,
      `Se editaron los datos del usuario: ${username}`,
    );

    res.json(usuarioActualizado);
  } catch (error: any) {
    if (error.code === "P2002")
      return res
        .status(400)
        .json({ error: "El username o Documento ya existe." });
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const usuarioInhabilitado = await prisma.usuario.update({
      where: { id },
      data: {
        activo: false,
        fechaEliminacion: new Date(),
      },
    });

    await registrarActividad(
      req,
      "INHABILITACIÓN",
      "Usuario",
      id,
      `Usuario ${usuarioInhabilitado.username} inhabilitado y movido a papelera`,
    );

    res.json({
      message: "Usuario inhabilitado temporalmente",
      usuario: usuarioInhabilitado,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al inhabilitar usuario" });
  }
});

app.patch("/api/usuarios/:id/restaurar", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const usuarioRestaurado = await prisma.usuario.update({
      where: { id },
      data: {
        activo: true,
        fechaEliminacion: null,
      },
    });

    await registrarActividad(
      req,
      "RESTAURACIÓN",
      "Usuario",
      id,
      `Usuario ${usuarioRestaurado.username} recuperado de la papelera`,
    );

    res.json({ message: "Usuario restaurado", usuario: usuarioRestaurado });
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar usuario" });
  }
});

// "limpieza-definitiva"
// Se ejecuta todos los días a las 00:00 (Medianoche)
cron.schedule('0 0 * * *', async () => {
  console.log("⏰ Ejecutando limpieza automática de usuarios inhabilitados...");
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const eliminados = await prisma.usuario.deleteMany({
      where: {
        activo: false,
        fechaEliminacion: { lte: hace30Dias },
      },
    });
    console.log(`✅ Limpieza completada: ${eliminados.count} usuarios eliminados permanentemente.`);
  } catch (error) {
    console.error("❌ Error en la limpieza automática:", error);
  }
});

// --- ELIMINAR USUARIO DEFINITIVAMENTE (FORZADO) ---
app.delete("/api/usuarios/:id/forzar", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // 1. Buscamos al usuario para obtener sus datos antes de borrarlo (para la auditoría)
    const usuarioABorrar = await prisma.usuario.findUnique({ where: { id } });

    if (!usuarioABorrar) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 2. Lo borramos definitivamente de la base de datos
    await prisma.usuario.delete({
      where: { id },
    });

    // 3. Registramos en auditoría que fue borrado del sistema
    await registrarActividad(
      req,
      "ELIMINACIÓN DEFINITIVA",
      "Usuario",
      id,
      `Se eliminó permanentemente del sistema al usuario: ${usuarioABorrar.username} (DNI: ${usuarioABorrar.documento})`,
    );

    res.json({ message: "Usuario eliminado permanentemente del sistema." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al eliminar usuario permanentemente" });
  }
});
// ==================================================================
// ======================== LOGIN  ==============================
// ==================================================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { username: username },
    });

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos." });
    }

    if (!usuario.activo) {
      return res
        .status(403)
        .json({ error: "Este usuario se encuentra inhabilitado." });
    }

    if (usuario.password !== password) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos." });
    }

    const { password: _, ...usuarioSinPassword } = usuario;

    // El req no tiene los headers todavía porque es el login, así que pasamos los datos manuales:
    await prisma.registroActividad.create({
      data: {
        operadorId: usuario.id,
        operadorDoc: usuario.documento,
        operadorNombre: `${usuario.apellido}, ${usuario.nombre}`,
        accion: "LOGIN",
        entidadAfectada: "Sistema",
        entidadId: usuario.id,
        detalles: `Inicio de sesión exitoso desde el sistema`,
      },
    });

    res.status(200).json({
      message: "Login exitoso",
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});
// ==================================================================
// ======================== MÓDULO AUDITORÍA ========================
// ==================================================================
app.get("/api/auditoria", async (req, res) => {
  const { fecha, operador, modulo } = req.query;

  try {
    const whereClause: any = { AND: [] };

    // 1. Filtro por Fecha Exacta
    if (fecha) {
      // Como fechaHora guarda horas y minutos, buscamos entre las 00:00 y las 23:59 de ese día
      const startOfDay = new Date(`${fecha}T00:00:00.000Z`);
      const endOfDay = new Date(`${fecha}T23:59:59.999Z`);
      whereClause.AND.push({
        fechaHora: { gte: startOfDay, lte: endOfDay },
      });
    }

    // 2. Filtro por Operador (Busca en DNI o Nombre)
    if (operador) {
      whereClause.AND.push({
        OR: [
          { operadorNombre: { contains: String(operador) } },
          { operadorDoc: { contains: String(operador) } },
        ],
      });
    }

    // 3. Filtro por Módulo / Entidad Afectada
    if (modulo) {
      whereClause.AND.push({
        entidadAfectada: { contains: String(modulo) },
      });
    }

    const registros = await prisma.registroActividad.findMany({
      where: whereClause.AND.length > 0 ? whereClause : undefined,
      orderBy: { fechaHora: "desc" },
    });

    res.json(registros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener la auditoría" });
  }
});

// ==================================================================
// ======================== MÓDULO CLIENTES =========================
// ==================================================================

// --- OBTENER CLIENTES ---
app.get("/api/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { razonSocial: "asc" },
    });
    // Ya NO enmascaramos la clave fiscal. Enviamos los datos crudos.
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// --- CREAR CLIENTE ---
app.post("/api/clientes", async (req, res) => {
  const { razonSocial, cuitEmpresa, cuitRepresentante, claveFiscal, domicilio, numero, telefono, email, jurisdiccion, condicionIva, idActividad } = req.body;
  try {
    const nuevoCliente = await prisma.cliente.create({
      data: { razonSocial, cuitEmpresa, cuitRepresentante, claveFiscal, domicilio, numero, telefono, email, jurisdiccion, condicionIva, idActividad, activo: true },
    });

    await registrarActividad(req, "CREACIÓN", "Cliente", nuevoCliente.id, `Se registró el cliente: ${razonSocial}`);
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    if (error.code === "P2002") return res.status(400).json({ error: "El CUIT ya está registrado." });
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

// --- ACTUALIZAR CLIENTE ---
app.put("/api/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  // Agregamos 'numero' aquí 👇
  const { razonSocial, cuitEmpresa, cuitRepresentante, claveFiscal, domicilio, numero, telefono, email, jurisdiccion, condicionIva, idActividad } = req.body;

  try {
    // Actualizamos TODOS los campos directamente, incluida la clave fiscal real y el numero
    const dataToUpdate = { razonSocial, cuitEmpresa, cuitRepresentante, claveFiscal, domicilio, numero, telefono, email, jurisdiccion, condicionIva, idActividad };

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: dataToUpdate,
    });

    await registrarActividad(req, "EDICIÓN", "Cliente", id, `Se editaron los datos del cliente: ${razonSocial}`);
    res.json(clienteActualizado);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "El CUIT ya existe." });
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

// --- ELIMINAR CLIENTE ---
app.delete("/api/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const inhabilitado = await prisma.cliente.update({
      where: { id },
      data: { activo: false, fechaEliminacion: new Date() },
    });
    await registrarActividad(req, "INHABILITACIÓN", "Cliente", id, `Cliente inhabilitado: ${inhabilitado.razonSocial}`);
    res.json(inhabilitado);
  } catch (error) {
    res.status(500).json({ error: "Error al inhabilitar cliente" });
  }
});

app.patch("/api/clientes/:id/restaurar", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const restaurado = await prisma.cliente.update({
      where: { id },
      data: { activo: true, fechaEliminacion: null },
    });
    await registrarActividad(req, "RESTAURACIÓN", "Cliente", id, `Cliente restaurado: ${restaurado.razonSocial}`);
    res.json(restaurado);
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar cliente" });
  }
});

app.delete("/api/clientes/:id/forzar", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const clienteABorrar = await prisma.cliente.findUnique({ where: { id } });
    if (!clienteABorrar) return res.status(404).json({ error: "Cliente no encontrado" });

    await prisma.cliente.delete({ where: { id } });
    await registrarActividad(req, "ELIMINACIÓN DEFINITIVA", "Cliente", id, `Se eliminó permanentemente al cliente: ${clienteABorrar.razonSocial}`);

    res.json({ message: "Eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar definitivamente" });
  }
});


// ==================================================================
// ======================== LISTEN PUERTO ===========================
// ==================================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
