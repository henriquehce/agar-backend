-- CreateTable
CREATE TABLE "anotacoes" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "humor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_fetais" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_fetais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "anotacoes" ADD CONSTRAINT "anotacoes_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_fetais" ADD CONSTRAINT "movimentos_fetais_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
