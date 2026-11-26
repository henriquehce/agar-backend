-- Módulo do profissional de saúde (RF20, RF21 e RN11).
-- O profissional tem conta própria, criada inativa: só a coordenação do AGAR a ativa,
-- depois de conferir o registro profissional. O acesso aos dados de uma gestante só
-- existe com um vínculo que ela mesma autoriza (código gerado na Carteirinha), e pode
-- ser revogado por ela a qualquer momento. Cada abertura de relatório fica registrada.
--
-- Ativar um profissional (coordenação):
--   npx wrangler d1 execute agar-db --remote --command "UPDATE profissionais SET ativo = 1 WHERE email = '<email>'"
--
-- Rollback:
--   DROP TABLE "acessos_profissional";
--   DROP TABLE "vinculos_profissional";
--   DROP TABLE "profissionais";
--   ALTER TABLE "gestantes" DROP COLUMN "codigoVinculoHash";
--   ALTER TABLE "gestantes" DROP COLUMN "codigoVinculoExpira";

CREATE TABLE "profissionais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "registro" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "profissionais_email_key" ON "profissionais"("email");

CREATE TABLE "vinculos_profissional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "profissionalId" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadoEm" DATETIME,
    CONSTRAINT "vinculos_profissional_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vinculos_profissional_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "vinculos_profissional_gestanteId_profissionalId_key" ON "vinculos_profissional"("gestanteId", "profissionalId");

CREATE TABLE "acessos_profissional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "profissionalId" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "acessos_profissional_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "acessos_profissional_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "profissionais" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "acessos_profissional_gestanteId_idx" ON "acessos_profissional"("gestanteId");

ALTER TABLE "gestantes" ADD COLUMN "codigoVinculoHash" TEXT;
ALTER TABLE "gestantes" ADD COLUMN "codigoVinculoExpira" DATETIME;
