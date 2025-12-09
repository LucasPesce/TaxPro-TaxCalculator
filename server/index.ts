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
// ======================== MÓDULO IVA VENTAS =======================
// ==================================================================

// --- RUTA: OBTENER TODAS LAS FACTURAS ---
app.get("/api/facturas", async (req, res) => {
  const { search, period } = req.query;

  try {
    const whereClause: any = { AND: [] };

    // 1. Filtro por Texto (Empresa o CUIT)
    if (search) {
      const searchTerm = String(search);
      whereClause.AND.push({
        OR: [
          { nombreEmpresa: { contains: searchTerm } }, // Busca coincidencias parciales en Nombre
          { cuitCliente: { contains: searchTerm } }, // Busca coincidencias parciales en CUIT
        ],
      });
    }

    // 2. Filtro por Periodo (Mes y Año)
    // El frontend envía formato "YYYY-MM" (ej: "2025-02")
    // La base de datos tiene formato "DD/MM/YYYY" (ej: "01/02/2025")
    if (period) {
      const [year, month] = String(period).split("-");
      const searchString = `/${month}/${year}`; // Convertimos a "/02/2025"

      whereClause.AND.push({
        fecha: { endsWith: searchString }, // Busca fechas que terminen con ese mes y año
      });
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

// --- RUTA: GUARDAR UN LOTE (IMPORTACIÓN) + AUDITORÍA ---
app.post("/api/facturas/lote", async (req, res) => {
  // 1. Recibimos 'tipoOperacion' (IVA Ventas / IVA Compras)
  const { invoices, cuitEmpresa, nombreEmpresa, tipoOperacion } = req.body;

  if (!invoices || !Array.isArray(invoices)) {
    return res.status(400).json({ error: "Se esperaba un array de facturas." });
  }

  try {
    const cuitActual = String(cuitEmpresa);
    const operacionActual = tipoOperacion || "IVA Ventas"; // Default por seguridad

    for (const f of invoices) {
      // Verificar duplicados
      const existe = await prisma.facturaVenta.findFirst({
        where: { cuitCliente: cuitActual, numeroFactura: f.nro },
      });

      if (!existe) {
        // 2. Guardar Factura
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

        // 3. REGISTRAR AUDITORÍA (Estado: Iniciado)
        await prisma.auditoria.create({
          data: {
            idUsuario: "01", // Usuario por defecto
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

    // --- GENERACIÓN AUTOMÁTICA DE FACTURAS FALTANTES ---

    const facturasAnalisis = await prisma.facturaVenta.findMany({
      where: { cuitCliente: cuitActual },
      orderBy: { numeroFactura: "asc" },
    });

    const gruposSeries: Record<string, typeof facturasAnalisis> = {};

    facturasAnalisis.forEach((f) => {
      // VALIDACIÓN ESTRICTA: Si el número no tiene guión (ej: "0005-0000001"), LO IGNORAMOS.
      // Esto evita que números basura como "13" o "01" rompan la lógica.
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
              // Formato estricto: 0005-00000044
              const numeroFaltanteStr = String(j).padStart(8, "0");
              const nroCompleto = `${ptVenta}-${numeroFaltanteStr}`;

              const existeHueco = await prisma.facturaVenta.findFirst({
                where: { cuitCliente: cuitActual, numeroFactura: nroCompleto },
              });

              if (!existeHueco) {
                // A. CREAR FACTURA EN BD
                const facturaGenerada = await prisma.facturaVenta.create({
                  data: {
                    cuitCliente: cuitActual,
                    nombreEmpresa: String(nombreEmpresa),
                    cliente: "--- FACTURA FALTANTE ---",
                    condicionIva: "Consumidor Final",
                    tipoDocumento: tipoDocSerie,
                    numeroDocumento: 0, // CUIT del cliente 0 porque no existe
                    fecha: "",
                    numeroFactura: nroCompleto, // <--- AQUÍ SE GUARDA EL NÚMERO
                    montoGravado: 0,
                    iva21: 0,
                    percIIBB: 0,
                    percMun: 0,
                    total: 0,
                    provincia: "Sin definir",
                  },
                });

                // B. AUDITORÍA
                await prisma.auditoria.create({
                  data: {
                    idUsuario: "Sistema",
                    idDocumento: facturaGenerada.id,
                    cuitEmpresa: cuitActual,
                    nroDocumento: nroCompleto, // <--- AQUÍ SE GUARDA EN AUDITORÍA
                    modificacion: "Registro Autogenerado",
                    estadoProceso: "Iniciado",
                    tipoOperacion: req.body.tipoOperacion || "IVA Ventas",
                  },
                });

                console.log(`Hueco rellenado: ${nroCompleto}`);
              }
            }
          }
        }
      }
    }

    // Devolver datos filtrados por CUIT
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

// --- RUTA: ACTUALIZAR FACTURA + AUDITORÍA ---
app.put("/api/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const datos = req.body;
  // Recibimos tipoOperacion en el body al editar
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

    // REGISTRAR AUDITORÍA (Estado: En Curso)
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

// --- RUTA: IMPACTAR DATOS (CIERRE DE PROCESO) ---
app.post("/api/facturas/impactar", async (req, res) => {
  const { cuitEmpresa, periodo, tipoOperacion } = req.body;
  // periodo viene como "2025-02"

  try {
    // 1. Buscamos todas las facturas de ese periodo y empresa
    const [year, month] = String(periodo).split("-");
    const searchString = `/${month}/${year}`;

    const facturasAImpactar = await prisma.facturaVenta.findMany({
      where: {
        cuitCliente: String(cuitEmpresa),
        fecha: { endsWith: searchString },
      },
    });

    if (facturasAImpactar.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay facturas para impactar en este periodo." });
    }

    // 2. Creamos registro de auditoría "Finalizado" para CADA factura
    // (Opcionalmente, podrías crear un solo registro "Master", pero tu prompt pedía por documento)

    // Usamos un Promise.all para hacerlo rápido en paralelo
    await Promise.all(
      facturasAImpactar.map((f) =>
        prisma.auditoria.create({
          data: {
            idUsuario: "01",
            idDocumento: f.id,
            cuitEmpresa: f.cuitCliente,
            nroDocumento: f.numeroFactura,
            modificacion: "Impacto de Datos (Cierre)",
            estadoProceso: "Finalizado",
            tipoOperacion: tipoOperacion || "IVA Ventas",
          },
        })
      )
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
// ======================== MÓDULO IVA COMPRAS ======================
// ==================================================================
// --- OBTENER COMPRAS ---
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

// --- IMPORTAR COMPRAS ---
app.post("/api/compras/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa, tipoOperacion } = req.body;

  if (!invoices || !Array.isArray(invoices))
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const cuitActual = String(cuitEmpresa);

    for (const f of invoices) {
      // En compras, chequeamos duplicado por CUIT Proveedor + Nro Factura
      // (Una misma empresa puede recibir facturas numero 0001 de distintos proveedores)
      const existe = await prisma.facturaCompra.findFirst({
        where: {
          cuitEmpresa: cuitActual,
          cuitProveedor: f.cuitProveedor, // Dato crucial en compras
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

            // Importes
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

        // Auditoría
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
        modificacion: "Alta Manual", // Aquí sí es Alta Manual
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

// --- ACTUALIZAR COMPRA ---
app.put("/api/compras/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const datos = req.body;

  try {
    // 1. Actualizamos la factura con TODOS los datos editables
    const actualizada = await prisma.facturaCompra.update({
      where: { id },
      data: {
        proveedor: datos.proveedor,
        cuitProveedor: datos.cuitProveedor,
        fechaImputacion: datos.fechaImputacion,
        tipoDocumento: datos.doc,
        numeroFactura: datos.nro,
        clasificacion: datos.clasificacion,
        
        // Importes (asegurando que sean números)
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

    // 2. ¡AQUÍ ESTABA EL FALTANTE! -> REGISTRAR EN AUDITORÍA
    await prisma.auditoria.create({
      data: {
        idUsuario: "01",
        idDocumento: id,
        cuitEmpresa: actualizada.cuitEmpresa, // Tomamos el CUIT de la factura actualizada
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

app.post("/api/facturas/impactar", async (req, res) => {
  const { cuitEmpresa, periodo, tipoOperacion } = req.body;
  // tipoOperacion viene como "IVA Ventas" o "IVA Compras"

  try {
    const [year, month] = String(periodo).split("-");
    const searchString = `/${month}/${year}`; // Filtro de fecha (ej: /02/2025)

    let facturasAImpactar: any[] = [];

    // 1. Buscar en la tabla correcta
    if (tipoOperacion === "IVA Compras") {
      facturasAImpactar = await prisma.facturaCompra.findMany({
        where: {
          cuitEmpresa: String(cuitEmpresa),
          fechaImputacion: { endsWith: searchString }, // En compras usamos fechaImputacion
        },
      });
    } else {
      // Asumimos IVA Ventas por defecto
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

    // 2. Generar Auditoría masiva
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
        })
      )
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
// ======================== LISTEN PUERTO ======================
// ==================================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
