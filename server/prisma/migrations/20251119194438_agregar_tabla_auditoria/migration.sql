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
    "fechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Auditoria_idDocumento_fkey" FOREIGN KEY ("idDocumento") REFERENCES "Facturas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
