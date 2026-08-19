-- CreateTable
CREATE TABLE "sinais_alerta" (
    "id" SERIAL NOT NULL,
    "nivel" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "borda" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "sintomas" TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sinais_alerta_pkey" PRIMARY KEY ("id")
);
