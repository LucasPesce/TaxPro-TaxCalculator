-- CreateTable
CREATE TABLE "FacturaVenta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cuitCliente" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "condicionIva" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroDocumento" REAL NOT NULL,
    "fecha" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "montoGravado" REAL NOT NULL,
    "iva21" REAL NOT NULL,
    "percIIBB" REAL NOT NULL,
    "percMun" REAL NOT NULL,
    "total" REAL NOT NULL,
    "provincia" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FacturaCompra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cuitEmpresa" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "cuitProveedor" TEXT NOT NULL,
    "condicionIva" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "fechaEmision" TEXT NOT NULL,
    "fechaImputacion" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "jurisdiccion" TEXT NOT NULL,
    "clasificacion" TEXT NOT NULL,
    "montoGravado" REAL NOT NULL DEFAULT 0,
    "exento" REAL NOT NULL DEFAULT 0,
    "percIva" REAL NOT NULL DEFAULT 0,
    "percIIBB" REAL NOT NULL DEFAULT 0,
    "percMun" REAL NOT NULL DEFAULT 0,
    "ganancias" REAL NOT NULL DEFAULT 0,
    "iva27" REAL NOT NULL DEFAULT 0,
    "iva21" REAL NOT NULL DEFAULT 0,
    "iva105" REAL NOT NULL DEFAULT 0,
    "otrasRetenciones" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "idProceso" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idUsuario" TEXT NOT NULL DEFAULT '01',
    "idDocumento" INTEGER NOT NULL,
    "cuitEmpresa" TEXT NOT NULL,
    "nroDocumento" TEXT NOT NULL,
    "modificacion" TEXT NOT NULL,
    "estadoProceso" TEXT NOT NULL,
    "tipoOperacion" TEXT NOT NULL,
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
