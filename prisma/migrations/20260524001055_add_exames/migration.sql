-- CreateTable
CREATE TABLE "exames" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "realizado" BOOLEAN NOT NULL DEFAULT false,
    "dataRealizacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exames_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
