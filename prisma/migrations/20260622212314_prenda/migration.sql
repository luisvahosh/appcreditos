-- CreateTable
CREATE TABLE "PrestamoPrenda" (
    "id" TEXT NOT NULL,
    "deudorId" TEXT NOT NULL,
    "bienGarantia" TEXT NOT NULL,
    "descripcion" TEXT,
    "capital" DOUBLE PRECISION NOT NULL,
    "tasaInteres" DOUBLE PRECISION NOT NULL,
    "fechaDesembolso" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "periodos" INTEGER NOT NULL DEFAULT 1,
    "pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "creadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrestamoPrenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CobroPrenda" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "recurrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CobroPrenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoPrenda" (
    "id" TEXT NOT NULL,
    "prestamoId" TEXT NOT NULL,
    "valorAbono" DOUBLE PRECISION NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" TEXT,
    "nota" TEXT,

    CONSTRAINT "PagoPrenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrestamoPrenda_deudorId_idx" ON "PrestamoPrenda"("deudorId");

-- CreateIndex
CREATE INDEX "PrestamoPrenda_estado_idx" ON "PrestamoPrenda"("estado");

-- CreateIndex
CREATE INDEX "CobroPrenda_prestamoId_idx" ON "CobroPrenda"("prestamoId");

-- CreateIndex
CREATE INDEX "PagoPrenda_prestamoId_idx" ON "PagoPrenda"("prestamoId");

-- AddForeignKey
ALTER TABLE "PrestamoPrenda" ADD CONSTRAINT "PrestamoPrenda_deudorId_fkey" FOREIGN KEY ("deudorId") REFERENCES "Deudor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrestamoPrenda" ADD CONSTRAINT "PrestamoPrenda_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroPrenda" ADD CONSTRAINT "CobroPrenda_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "PrestamoPrenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoPrenda" ADD CONSTRAINT "PagoPrenda_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "PrestamoPrenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoPrenda" ADD CONSTRAINT "PagoPrenda_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

