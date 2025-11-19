-- CreateTable
CREATE TABLE "Facturas" (
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
