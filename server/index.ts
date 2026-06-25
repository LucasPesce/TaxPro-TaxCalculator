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
  datosAnteriores: any = null,
  datosNuevos: any = null,
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
      entidadId,
      detalles,
      datosAnteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
      datosNuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
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
      const term = String(search);
      const termLimpio = term.replace(/\D/g, "");
      whereClause.AND.push({
        OR: [
          { nombreEmpresa: { contains: term } },
          { cuitEmpresa: { contains: termLimpio } }, // Cambiado a cuitEmpresa
        ],
      });
    }

    if (period) {
      const [year, month] = String(period).split("-");
      const monthSingle = parseInt(month, 10).toString();
      whereClause.AND.push({
        OR: [
          { fecha: { contains: `/${month}/${year}` } },
          { fecha: { contains: `/${monthSingle}/${year}` } },
          { fecha: { contains: `${year}-${month}` } },
          { fecha: { contains: `${year}-${monthSingle}` } },
        ],
      });
    }

    const facturas = await prisma.facturaVenta.findMany({
      where: whereClause.AND.length > 0 ? whereClause : undefined,
      orderBy: { numeroFactura: "asc" },
    });
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las facturas" });
  }
});

app.post("/api/facturas/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa } = req.body;
  if (!invoices || !Array.isArray(invoices))
    return res.status(400).json({ error: "Datos inválidos." });

  try {
    const cuitActual = String(cuitEmpresa);
    let facturasInsertadas = 0;
    const periodoMuestra =
      invoices.length > 0 ? invoices[0].fecha.substring(3) : "Desconocido";

    for (const f of invoices) {
      const existe = await prisma.facturaVenta.findFirst({
        where: { cuitEmpresa: cuitActual, numeroFactura: f.numeroFactura }, // Cambiado a cuitEmpresa
      });

      if (!existe) {
        await prisma.facturaVenta.create({
          data: {
            cuitEmpresa: cuitActual,
            nombreEmpresa: String(nombreEmpresa),
            fecha: f.fecha,
            tipoComprobante: f.tipoComprobante,
            puntoVenta: f.puntoVenta,
            numeroDesde: f.numeroDesde,
            numeroHasta: f.numeroHasta,
            numeroFactura: f.numeroFactura,
            codAutorizacion: f.codAutorizacion,
            tipoDocReceptor: f.tipoDocReceptor,
            nroDocReceptor: f.nroDocReceptor,
            denominacionReceptor: f.denominacionReceptor,
            tipoCambio: f.tipoCambio,
            moneda: f.moneda,
            netoGravado0: f.netoGravado0,
            iva25: f.iva25,
            netoGravado25: f.netoGravado25,
            iva5: f.iva5,
            netoGravado5: f.netoGravado5,
            iva105: f.iva105,
            netoGravado105: f.netoGravado105,
            iva21: f.iva21,
            netoGravado21: f.netoGravado21,
            iva27: f.iva27,
            netoGravado27: f.netoGravado27,
            montoGravadoTotal: f.montoGravadoTotal,
            netoNoGravado: f.netoNoGravado,
            operacionesExentas: f.operacionesExentas,
            otrosTributos: f.otrosTributos,
            totalIva: f.totalIva,
            total: f.total,
          },
        });
        facturasInsertadas++;
      }
    }

    if (facturasInsertadas > 0) {
      await registrarActividad(
        req,
        "IMPORTACIÓN",
        "Lote Ventas",
        0,
        `Importación de ${facturasInsertadas} facturas de venta (Cliente: ${cuitActual}) periodo ${periodoMuestra}`,
      );
    }

    // --- REVISIÓN DE CORRELATIVIDAD  ---
    const facturasAnalisis = await prisma.facturaVenta.findMany({ where: { cuitEmpresa: cuitActual }, orderBy: { numeroFactura: "asc" } });
    const gruposSeries: Record<string, typeof facturasAnalisis> = {};
    
    facturasAnalisis.forEach((f) => {
      if (!f.numeroFactura || !f.numeroFactura.includes("-")) return;
      const claveGrupo = `${f.puntoVenta}|${f.tipoComprobante}`;
      if (!gruposSeries[claveGrupo]) gruposSeries[claveGrupo] = [];
      gruposSeries[claveGrupo].push(f);
    });

    let huecosGenerados = 0;

    for (const clave in gruposSeries) {
      const [ptoVentaStr, tipoCompStr] = clave.split("|");
      
      // Ordenamos las facturas del lote actual de menor a mayor
      const numerosOrdenados = gruposSeries[clave]
        .map((f) => parseInt(f.numeroDesde, 10))
        .sort((a, b) => a - b);

      if (numerosOrdenados.length === 0) continue;

      const primerNumeroLote = numerosOrdenados[0];

      // 1. CONTROL INTER-PERÍODO: Buscamos la última factura histórica menor a la primera del lote actual
      const ultimaHistorica = await prisma.facturaVenta.findFirst({
        where: {
          cuitEmpresa: cuitActual,
          puntoVenta: ptoVentaStr,
          tipoComprobante: tipoCompStr,
          // Evitamos buscar las que son del lote actual
          numeroDesde: {
            lt: String(primerNumeroLote).padStart(8, "0")
          }
        },
        orderBy: { numeroDesde: 'desc' } // Trae la más alta disponible
      });

      if (ultimaHistorica) {
        const ultimoNumeroHistorico = parseInt(ultimaHistorica.numeroDesde, 10);
        
        // Si hay un hueco entre la última histórica y la primera del nuevo lote, lo rellenamos
        if (primerNumeroLote > ultimoNumeroHistorico + 1) {
          console.log(`⚠️ Hueco Inter-Período detectado entre Nro ${ultimoNumeroHistorico} y Nro ${primerNumeroLote}`);
          for (let j = ultimoNumeroHistorico + 1; j < primerNumeroLote; j++) {
            const nroFaltanteStr = String(j).padStart(8, "0");
            const nroCompleto = `${ptoVentaStr}-${nroFaltanteStr}`;

            const existeHueco = await prisma.facturaVenta.findFirst({ where: { cuitEmpresa: cuitActual, numeroFactura: nroCompleto }});
            if (!existeHueco) {
              await prisma.facturaVenta.create({
                data: {
                  cuitEmpresa: cuitActual, nombreEmpresa: String(nombreEmpresa), 
                  denominacionReceptor: "--- FACTURA FALTANTE ---", nroDocReceptor: "0", tipoDocReceptor: "0",
                  tipoComprobante: tipoCompStr, puntoVenta: ptoVentaStr, numeroDesde: nroFaltanteStr, numeroHasta: nroFaltanteStr,
                  numeroFactura: nroCompleto, codAutorizacion: "", moneda: "PES", tipoCambio: 1, fecha: "",
                },
              });
              huecosGenerados++;
            }
          }
        }
      }

      // 2. CONTROL INTRA-PERÍODO: El análisis normal dentro del mismo mes
      if (numerosOrdenados.length > 1) {
        for (let i = 0; i < numerosOrdenados.length - 1; i++) {
          const actual = numerosOrdenados[i];
          const siguiente = numerosOrdenados[i + 1];

          if (siguiente > actual + 1) {
            for (let j = actual + 1; j < siguiente; j++) {
              const nroFaltanteStr = String(j).padStart(8, "0");
              const nroCompleto = `${ptoVentaStr}-${nroFaltanteStr}`;
              
              const existeHueco = await prisma.facturaVenta.findFirst({ where: { cuitEmpresa: cuitActual, numeroFactura: nroCompleto }});
              
              if (!existeHueco) {
                await prisma.facturaVenta.create({
                  data: {
                    cuitEmpresa: cuitActual, nombreEmpresa: String(nombreEmpresa), 
                    denominacionReceptor: "--- FACTURA FALTANTE ---", nroDocReceptor: "0", tipoDocReceptor: "0",
                    tipoComprobante: tipoCompStr, puntoVenta: ptoVentaStr, numeroDesde: nroFaltanteStr, numeroHasta: nroFaltanteStr,
                    numeroFactura: nroCompleto, codAutorizacion: "", moneda: "PES", tipoCambio: 1, fecha: "",
                  },
                });
                huecosGenerados++;
              }
            }
          }
        }
      }
    }
                                                                                   

    if (huecosGenerados > 0) {
      await registrarActividad(
        req,
        "AUTO-CREACIÓN",
        "Lote Ventas",
        0,
        `Generados ${huecosGenerados} registros faltantes por correlatividad para ${cuitActual}`,
      );
    }

    res
      .status(201)
      .json(
        await prisma.facturaVenta.findMany({
          where: { cuitEmpresa: cuitActual },
          orderBy: { numeroFactura: "asc" },
        }),
      );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar el lote" });
  }
});

app.put("/api/facturas/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const f = req.body;

  try {
    const registroAnterior = await prisma.facturaVenta.findUnique({
      where: { id },
    });

    const facturaActualizada = await prisma.facturaVenta.update({
      where: { id: id },
      data: {
        fecha: f.fecha,
        tipoComprobante: f.tipoComprobante,
        puntoVenta: f.puntoVenta,
        numeroDesde: f.numeroDesde,
        numeroHasta: f.numeroHasta,
        numeroFactura: f.numeroFactura,
        codAutorizacion: f.codAutorizacion,
        tipoDocReceptor: f.tipoDocReceptor,
        nroDocReceptor: f.nroDocReceptor,
        denominacionReceptor: f.denominacionReceptor,
        tipoCambio: f.tipoCambio,
        moneda: f.moneda,
        netoGravado0: f.netoGravado0,
        iva25: f.iva25,
        netoGravado25: f.netoGravado25,
        iva5: f.iva5,
        netoGravado5: f.netoGravado5,
        iva105: f.iva105,
        netoGravado105: f.netoGravado105,
        iva21: f.iva21,
        netoGravado21: f.netoGravado21,
        iva27: f.iva27,
        netoGravado27: f.netoGravado27,
        montoGravadoTotal: f.montoGravadoTotal,
        netoNoGravado: f.netoNoGravado,
        operacionesExentas: f.operacionesExentas,
        otrosTributos: f.otrosTributos,
        totalIva: f.totalIva,
        total: f.total,
      },
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "FacturaVenta",
      id,
      `Se editó la factura de venta: ${facturaActualizada.numeroFactura}`,
      registroAnterior,
      facturaActualizada,
    );
    res.json(facturaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Error al actualizar la factura` });
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
      const termLimpio = term.replace(/\D/g, "");

      whereClause.AND.push({
        OR: [
          { nombreEmpresa: { contains: term } },
          { cuitEmpresa: { contains: termLimpio } },
        ],
      });
    }

    if (period) {
      const [year, month] = String(period).split("-");
      const monthSingle = parseInt(month, 10).toString();

      whereClause.AND.push({
        OR: [
          { fechaImputacion: { contains: `/${month}/${year}` } },
          { fechaImputacion: { contains: `/${monthSingle}/${year}` } },
          { fechaImputacion: { contains: `${year}-${month}` } },
          { fechaImputacion: { contains: `${year}-${monthSingle}` } },
        ],
      });
    }

    const compras = await prisma.facturaCompra.findMany({
      where: whereClause.AND.length > 0 ? whereClause : undefined,
      orderBy: { fechaImputacion: "asc" },
    });

    // 🚨 Nos dirá si la base de datos devolvió los registros o no

    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener compras" });
  }
});

app.post("/api/compras/lote", async (req, res) => {
  const { invoices, cuitEmpresa, nombreEmpresa } = req.body;

  if (!invoices || !Array.isArray(invoices))
    return res.status(400).json({ error: "Datos inválidos" });

  try {
    const cuitActual = String(cuitEmpresa);
    let comprasInsertadas = 0;
    const periodoMuestra = invoices.length > 0 ? invoices[0].fechaImputacion.substring(3) : "Desconocido";

    console.log(`📥 Recibida petición de importación de Compras para CUIT: ${cuitActual}`);
    console.log(`📊 Cantidad de facturas enviadas por el navegador: ${invoices.length}`);

for (const f of invoices) {
      // 🚨 CORRECCIÓN: Cambiamos f.nro por f.numeroFactura en todo el bloque
      const existe = await prisma.facturaCompra.findFirst({
        where: {
          cuitEmpresa: cuitActual,
          cuitProveedor: f.cuitProveedor,
          numeroFactura: f.numeroFactura,
        },
      });

      if (existe) {
        console.log(`⚠️ Ignorada por duplicada (Ya existe en BD): Nro: "${f.numeroFactura}"`);
      }

      if (!existe) {
        console.log(`💾 Guardando en BD: Nro: "${f.numeroFactura}"`);
        await prisma.facturaCompra.create({
          data: {
            cuitEmpresa: cuitActual,
            nombreEmpresa: String(nombreEmpresa),
            fechaEmision: f.fechaEmision,
            fechaImputacion: f.fechaImputacion,
            tipoComprobante: f.tipoComprobante,
            puntoVenta: f.puntoVenta,
            numeroDesde: f.numeroDesde,
            numeroHasta: f.numeroHasta,
            numeroFactura: f.numeroFactura,
            codAutorizacion: f.codAutorizacion,
            tipoDocEmisor: f.tipoDocEmisor,
            cuitProveedor: f.cuitProveedor,
            proveedor: f.proveedor,
            tipoCambio: f.tipoCambio,
            moneda: f.moneda,
            montoGravado: f.montoGravado,
            netoNoGravado: f.netoNoGravado,
            exento: f.exento,
            otrosTributos: f.otrosTributos,
            iva: f.iva,
            total: f.total,
            provincia: f.provincia || "Córdoba",
            jurisdiccion: f.jurisdiccion || "Córdoba",
            activo: true,
          },
        });
        comprasInsertadas++;
      }
    }

    if (comprasInsertadas > 0) {
      await registrarActividad(
        req,
        "IMPORTACIÓN",
        "Lote Compras",
        0,
        `El usuario importó ${comprasInsertadas} comprobantes del cliente ${nombreEmpresa} (${cuitActual}) periodo ${periodoMuestra}`,
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
        fechaEmision: f.fechaEmision,
        fechaImputacion: f.fechaImputacion,
        tipoComprobante: f.tipoComprobante,
        puntoVenta: f.puntoVenta,
        numeroDesde: f.numeroDesde,
        numeroHasta: f.numeroHasta,
        numeroFactura: f.numeroFactura,
        codAutorizacion: f.codAutorizacion,
        tipoDocEmisor: f.tipoDocEmisor,
        cuitProveedor: f.cuitProveedor,
        proveedor: f.proveedor,
        tipoCambio: parseFloat(f.tipoCambio) || 1,
        moneda: f.moneda || "PES",
        montoGravado: parseFloat(f.montoGravado) || 0,
        netoNoGravado: parseFloat(f.netoNoGravado) || 0,
        exento: parseFloat(f.exento) || 0,
        otrosTributos: parseFloat(f.otrosTributos) || 0,
        iva: parseFloat(f.iva) || 0,
        total: parseFloat(f.total) || 0,
        provincia: f.provincia || "Córdoba",
        jurisdiccion: f.jurisdiccion || "Córdoba",
      },
    });

    await registrarActividad(
      req,
      "CREACIÓN",
      "FacturaCompra",
      nueva.id,
      `Alta manual de compra: ${f.numeroFactura}`,
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
    const registroAnterior = await prisma.facturaCompra.findUnique({ where: { id }});
    
    const actualizada = await prisma.facturaCompra.update({
      where: { id },
      data: {
        fechaEmision: datos.fechaEmision,
        fechaImputacion: datos.fechaImputacion,
        tipoComprobante: datos.tipoComprobante,
        puntoVenta: datos.puntoVenta,
        numeroDesde: datos.numeroDesde,
        numeroHasta: datos.numeroHasta,
        numeroFactura: datos.numeroFactura,
        codAutorizacion: datos.codAutorizacion,
        tipoDocEmisor: datos.tipoDocEmisor,
        cuitProveedor: datos.cuitProveedor,
        proveedor: datos.proveedor,
        tipoCambio: parseFloat(datos.tipoCambio) || 1,
        moneda: datos.moneda || "PES",
        montoGravado: parseFloat(datos.montoGravado) || 0,
        netoNoGravado: parseFloat(datos.netoNoGravado) || 0,
        exento: parseFloat(datos.exento) || 0,
        otrosTributos: parseFloat(datos.otrosTributos) || 0,
        iva: parseFloat(datos.iva) || 0,
        total: parseFloat(datos.total) || 0,
      },
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "FacturaCompra",
      id,
      `Se editó la compra: ${actualizada.numeroFactura}`,
      registroAnterior, 
      actualizada
    );

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
          cuitEmpresa: String(cuitEmpresa),
          fecha: { endsWith: searchString },
        },
      });
    }

    if (facturasAImpactar.length === 0) {
      return res.status(404).json({
        message: "No hay comprobantes para impactar en este periodo.",
      });
    }

    await registrarActividad(
      req,
      "IMPACTO (CIERRE)",
      esCompra ? "Lote Compras" : "Lote Ventas",
      0,
      `Se cerró e impactó el periodo ${periodo} para el CUIT ${cuitEmpresa}. Total registros congelados: ${facturasAImpactar.length}`,
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
// ======================== MÓDULO PROVEEDORES ======================
// ==================================================================

app.get("/api/proveedores", async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { razonSocial: "asc" },
    });
    res.json(proveedores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

app.post("/api/proveedores", async (req, res) => {
  const {
    razonSocial,
    cuitProveedor,
    domicilio,
    numero,
    telefono,
    email,
    jurisdiccion,
    condicionIva,
    idActividad,
    idTipoCompra,
  } = req.body;
  try {
    const nuevo = await prisma.proveedor.create({
      data: {
        razonSocial,
        cuitProveedor,
        domicilio,
        numero,
        telefono,
        email,
        jurisdiccion,
        condicionIva,
        idActividad,
        idTipoCompra,
        activo: true,
      },
    });
    await registrarActividad(
      req,
      "CREACIÓN",
      "Proveedor",
      nuevo.id,
      `Se registró el proveedor: ${razonSocial}`,
    );
    res.status(201).json(nuevo);
  } catch (error: any) {
    if (error.code === "P2002")
      return res
        .status(400)
        .json({ error: "El CUIT del proveedor ya está registrado." });
    res.status(500).json({ error: "Error al crear proveedor" });
  }
});

app.put("/api/proveedores/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const dataToUpdate = req.body;

  try {
    const registroAnterior = await prisma.proveedor.findUnique({
      where: { id },
    });
    const actualizado = await prisma.proveedor.update({
      where: { id },
      data: dataToUpdate,
    });
    await registrarActividad(
      req,
      "EDICIÓN",
      "Proveedor",
      id,
      `Se editaron los datos del proveedor: ${actualizado.razonSocial}`,
      registroAnterior,
      actualizado,
    );
    res.json(actualizado);
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "El CUIT ya existe." });
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
});

app.delete("/api/proveedores/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const inhabilitado = await prisma.proveedor.update({
      where: { id },
      data: { activo: false, fechaEliminacion: new Date() },
    });
    await registrarActividad(
      req,
      "INHABILITACIÓN",
      "Proveedor",
      id,
      `Proveedor inhabilitado: ${inhabilitado.razonSocial}`,
    );
    res.json(inhabilitado);
  } catch (error) {
    res.status(500).json({ error: "Error al inhabilitar proveedor" });
  }
});

app.patch("/api/proveedores/:id/restaurar", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const restaurado = await prisma.proveedor.update({
      where: { id },
      data: { activo: true, fechaEliminacion: null },
    });
    await registrarActividad(
      req,
      "RESTAURACIÓN",
      "Proveedor",
      id,
      `Proveedor restaurado: ${restaurado.razonSocial}`,
    );
    res.json(restaurado);
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar proveedor" });
  }
});

// ==================================================================
// ======================== MÓDULO CLIENTES =========================
// ==================================================================

app.get("/api/clientes", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { razonSocial: "asc" },
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

app.post("/api/clientes", async (req, res) => {
  const {
    razonSocial,
    cuitEmpresa,
    cuitRepresentante,
    claveFiscal,
    domicilio,
    numero,
    telefono,
    email,
    jurisdiccion,
    condicionIva,
    idActividad,
  } = req.body;
  try {
    const nuevoCliente = await prisma.cliente.create({
      data: {
        razonSocial,
        cuitEmpresa,
        cuitRepresentante,
        claveFiscal,
        domicilio,
        numero,
        telefono,
        email,
        jurisdiccion,
        condicionIva,
        idActividad,
        activo: true,
      },
    });

    await registrarActividad(
      req,
      "CREACIÓN",
      "Cliente",
      nuevoCliente.id,
      `Se registró el cliente: ${razonSocial}`,
    );
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "El CUIT ya está registrado." });
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

app.put("/api/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    razonSocial,
    cuitEmpresa,
    cuitRepresentante,
    claveFiscal,
    domicilio,
    numero,
    telefono,
    email,
    jurisdiccion,
    condicionIva,
    idActividad,
  } = req.body;

  try {
    const registroAnterior = await prisma.cliente.findUnique({ where: { id } });
    const dataToUpdate = {
      razonSocial,
      cuitEmpresa,
      cuitRepresentante,
      claveFiscal,
      domicilio,
      numero,
      telefono,
      email,
      jurisdiccion,
      condicionIva,
      idActividad,
    };

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: dataToUpdate,
    });

    await registrarActividad(
      req,
      "EDICIÓN",
      "Cliente",
      id,
      `Se editaron los datos del cliente: ${razonSocial}`,
      registroAnterior,
      clienteActualizado,
    );
    res.json(clienteActualizado);
  } catch (error: any) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "El CUIT ya existe." });
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

app.delete("/api/clientes/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const inhabilitado = await prisma.cliente.update({
      where: { id },
      data: { activo: false, fechaEliminacion: new Date() },
    });
    await registrarActividad(
      req,
      "INHABILITACIÓN",
      "Cliente",
      id,
      `Cliente inhabilitado: ${inhabilitado.razonSocial}`,
    );
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
    await registrarActividad(
      req,
      "RESTAURACIÓN",
      "Cliente",
      id,
      `Cliente restaurado: ${restaurado.razonSocial}`,
    );
    res.json(restaurado);
  } catch (error) {
    res.status(500).json({ error: "Error al restaurar cliente" });
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
    const registroAnterior = await prisma.usuario.findUnique({ where: { id } });
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
      registroAnterior,
      usuarioActualizado,
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

// ==================================================================
// ==================== CRON JOB: LIMPIEZA DIARIA ===================
// ==================================================================
cron.schedule("0 0 * * *", async () => {
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
    console.log(
      `✅ Limpieza completada: ${eliminados.count} usuarios eliminados permanentemente.`,
    );
  } catch (error) {
    console.error("❌ Error en la limpieza automática:", error);
  }
});

// ==================================================================
// ======================== MÓDULO AUDITORÍA ========================
// ==================================================================
app.get("/api/auditoria", async (req, res) => {
  const { fechaDesde, fechaHasta, operador, modulo } = req.query;

  try {
    const whereClause: any = { AND: [] };

    // Filtro por Rango de Fechas (Desde - Hasta)
    if (fechaDesde && fechaHasta) {
      const startOfDay = new Date(`${fechaDesde}T00:00:00.000Z`);
      const endOfDay = new Date(`${fechaHasta}T23:59:59.999Z`);
      whereClause.AND.push({
        fechaHora: { gte: startOfDay, lte: endOfDay },
      });
    }

    if (operador) {
      whereClause.AND.push({
        OR: [
          { operadorNombre: { contains: String(operador) } },
          { operadorDoc: { contains: String(operador) } },
        ],
      });
    }

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
// ======================== LOGIN REAL ==============================
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
// ======================== LISTEN PUERTO ===========================
// ==================================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
