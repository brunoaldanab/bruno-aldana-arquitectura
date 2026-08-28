-- CreateEnum
CREATE TYPE "GaleriaTipo" AS ENUM ('ESTILO', 'MOBILIARIO');

-- CreateTable
CREATE TABLE "GaleriaFoto" (
    "id" TEXT NOT NULL,
    "tipo" "GaleriaTipo" NOT NULL,
    "cardKey" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaleriaFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GaleriaCardCustom" (
    "id" TEXT NOT NULL,
    "tipo" "GaleriaTipo" NOT NULL,
    "key" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "facts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GaleriaCardCustom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaletaOficinaFoto" (
    "id" TEXT NOT NULL,
    "comboKey" TEXT NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaletaOficinaFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaletaOficinaCustom" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "colores" JSONB NOT NULL,
    "uso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaletaOficinaCustom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GaleriaFoto_tipo_cardKey_idx" ON "GaleriaFoto"("tipo", "cardKey");

-- CreateIndex
CREATE UNIQUE INDEX "GaleriaCardCustom_key_key" ON "GaleriaCardCustom"("key");

-- CreateIndex
CREATE INDEX "PaletaOficinaFoto_comboKey_idx" ON "PaletaOficinaFoto"("comboKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaletaOficinaCustom_key_key" ON "PaletaOficinaCustom"("key");
