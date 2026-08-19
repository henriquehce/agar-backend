-- CreateTable
CREATE TABLE "registros_mensais" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "peso" TEXT,
    "au" TEXT,
    "bcf" TEXT,
    "pressao" TEXT,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_mensais_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "registros_mensais" ADD CONSTRAINT "registros_mensais_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
