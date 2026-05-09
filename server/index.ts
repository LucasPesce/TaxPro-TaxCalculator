// server/index.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==================================================================
// =================== FUNCIÓN DE AUDITORÍA GENERAL =================
// ==================================================================
const registrarActividad = async (req: any, accion: string, entidadAfectada: string, entidadId: number, detalles: string) => {
  const operadorId = parseInt(req.header('X-Operador-Id') || '0', 10);
  const operadorDoc = req.header('X-Operador-Doc') || 'Desconocido';
  const operadorNombre = req.header('X-Operador-Nombre') || 'Sistema';

  await prisma.registroActividad.create({
    data: {
      operadorId,
      operadorDoc,
      operadorNombre,
      accion,
      entidadAfectada,
      entidadId,
      detalles
    }
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

app.post("/api/facturas/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa, tipoOperacion } = req.body;

  if (!invoices || !Array.isArray(invoices)) {
    return res.status(400).json({ error: "Se esperaba un array de facturas." });
  }

  try {
    const cuitActual = String(cuitEmpresa);
    const operacionActual = tipoOperacion || "IVA Ventas"; 

    for (const f of invoices) {
      const existe = await prisma.facturaVenta.findFirst({
        where: { cuitCliente: cuitActual, numeroFactura: f.nro },
      });

      if (!existe) {
        const nuevaFactura = await prisma.facturaVenta.create({
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

        await prisma.auditoria.create({
          data: {
            idUsuario: "01", 
            idDocumento: nuevaFactura.id,
            cuitEmpresa: cuitActual,
            nroDocumento: f.nro,
            modificacion: "Importación Inicial",
            estadoProceso: "Iniciado",
            tipoOperacion: operacionActual,
          },
        });
      }
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
                const facturaGenerada = await prisma.facturaVenta.create({
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

                await prisma.auditoria.create({
                  data: {
                    idUsuario: "Sistema",
                    idDocumento: facturaGenerada.id,
                    cuitEmpresa: cuitActual,
                    nroDocumento: nroCompleto, 
                    modificacion: "Registro Autogenerado",
                    estadoProceso: "Iniciado",
                    tipoOperacion: req.body.tipoOperacion || "IVA Ventas",
                  },
                });
              }
            }
          }
        }
      }
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
  const operacionActual = datos.tipoOperacion || "IVA Ventas";

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

    await prisma.auditoria.create({
      data: {
        idUsuario: "01",
        idDocumento: id,
        cuitEmpresa: facturaActualizada.cuitCliente,
        nroDocumento: facturaActualizada.numeroFactura,
        modificacion: "Modificación de campos",
        estadoProceso: "En Curso",
        tipoOperacion: operacionActual,
      },
    });

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

app.post("/api/compras/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa, tipoOperacion } = req.body;

  if (!invoices || !Array.isArray(invoices))
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const cuitActual = String(cuitEmpresa);

    for (const f of invoices) {
      const existe = await prisma.facturaCompra.findFirst({
        where: {
          cuitEmpresa: cuitActual,
          cuitProveedor: f.cuitProveedor, 
          numeroFactura: f.nro,
        },
      });

      if (!existe) {
        const nueva = await prisma.facturaCompra.create({
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

        await prisma.auditoria.create({
          data: {
            idDocumento: nueva.id,
            cuitEmpresa: cuitActual,
            nroDocumento: f.nro,
            modificacion: "Importación Compra",
            estadoProceso: "En Curso",
            tipoOperacion: "IVA Compras",
          },
        });
      }
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

    await prisma.auditoria.create({
      data: {
        idUsuario: "01",
        idDocumento: nueva.id,
        cuitEmpresa: cuitActual,
        nroDocumento: f.nro,
        modificacion: "Alta Manual", 
        estadoProceso: "En Curso",
        tipoOperacion: "IVA Compras",
      },
    });

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

    await prisma.auditoria.create({
      data: {
        idUsuario: "01",
        idDocumento: id,
        cuitEmpresa: actualizada.cuitEmpresa, 
        nroDocumento: actualizada.numeroFactura,
        modificacion: "Modificación de campos (Compras)",
        estadoProceso: "En Curso",
        tipoOperacion: "IVA Compras",
      },
    });

    res.json(actualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando compra" });
  }
});

// --- RUTA COMPARTIDA: IMPACTAR (COMPRAS Y VENTAS) ---
app.post("/api/facturas/impactar", async (req, res) => {
  const { cuitEmpresa, periodo, tipoOperacion } = req.body;

  try {
    const [year, month] = String(periodo).split("-");
    const searchString = `/${month}/${year}`; 

    let facturasAImpactar: any[] = [];

    if (tipoOperacion === "IVA Compras") {
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

    await Promise.all(
      facturasAImpactar.map((f) =>
        prisma.auditoria.create({
          data: {
            idUsuario: "01",
            idDocumento: f.id,
            cuitEmpresa: String(cuitEmpresa),
            nroDocumento: f.numeroFactura,
            modificacion: "Impacto de Datos (Cierre)",
            estadoProceso: "Finalizado",
            tipoOperacion: tipoOperacion,
          },
        }),
      ),
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

    // 🚨 AUDITORÍA
    await registrarActividad(req, "CREACIÓN", "Usuario", nuevoUsuario.id, `Se creó el usuario: ${username} con rol ${rol}`);

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

    // 🚨 AUDITORÍA
    await registrarActividad(req, "EDICIÓN", "Usuario", id, `Se editaron los datos del usuario: ${username}`);

    res.json(usuarioActualizado);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "El username o Documento ya existe." });
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

    // 🚨 AUDITORÍA
    await registrarActividad(req, "INHABILITACIÓN", "Usuario", id, `Usuario inhabilitado y movido a papelera`);

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

    // 🚨 AUDITORÍA
    await registrarActividad(req, "RESTAURACIÓN", "Usuario", id, `Usuario recuperado de la papelera`);

    res.json({ message: "Usuario restaurado", usuario: usuarioRestaurado });
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar usuario" });
  }
});

app.delete("/api/usuarios/limpieza-definitiva", async (req, res) => {
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const eliminados = await prisma.usuario.deleteMany({
      where: {
        activo: false,
        fechaEliminacion: {
          lte: hace30Dias, 
        },
      },
    });
    res.json({
      message: `Se eliminaron permanentemente ${eliminados.count} usuarios.`,
    });
  } catch (error) {
    res.status(500).json({ error: "Error en la limpieza definitiva" });
  }
});

// ==================================================================
// ======================== LOGIN REAL ==============================
// ==================================================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { username: username },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Este usuario se encuentra inhabilitado." });
    }

    if (usuario.password !== password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const { password: _, ...usuarioSinPassword } = usuario;

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
// ======================== LISTEN PUERTO ===========================
// ==================================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
