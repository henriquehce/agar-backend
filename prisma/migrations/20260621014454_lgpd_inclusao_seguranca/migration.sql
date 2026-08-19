-- DropForeignKey
ALTER TABLE "consultas" DROP CONSTRAINT "consultas_gestanteId_fkey";

-- DropForeignKey
ALTER TABLE "exames" DROP CONSTRAINT "exames_gestanteId_fkey";

-- DropForeignKey
ALTER TABLE "monitoramentos" DROP CONSTRAINT "monitoramentos_gestanteId_fkey";

-- DropForeignKey
ALTER TABLE "registros_mensais" DROP CONSTRAINT "registros_mensais_gestanteId_fkey";

-- AlterTable
ALTER TABLE "gestantes" ADD COLUMN     "consentimentoData" TIMESTAMP(3),
ADD COLUMN     "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentimentoVersao" TEXT,
ADD COLUMN     "identidadeGenero" TEXT,
ADD COLUMN     "nomeSocial" TEXT;

-- CreateTable
CREATE TABLE "logs_acesso" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_acesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramentos" ADD CONSTRAINT "monitoramentos_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames" ADD CONSTRAINT "exames_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_mensais" ADD CONSTRAINT "registros_mensais_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
