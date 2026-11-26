-- Coordenação do AGAR no app (RF23): profissionais marcados como coordenadores liberam,
-- bloqueiam ou recusam os pedidos de acesso pela tela de coordenação, em vez de um
-- comando no banco. Cada liberação registra quem liberou e quando.
--
-- Marcar a primeira coordenadora (uma vez, depois de ela pedir acesso pelo app):
--   npx wrangler d1 execute agar-db --remote --command "UPDATE profissionais SET ativo = 1, coordenador = 1 WHERE email = '<email>'"
--
-- Rollback:
--   ALTER TABLE "profissionais" DROP COLUMN "coordenador";
--   ALTER TABLE "profissionais" DROP COLUMN "aprovadoEm";
--   ALTER TABLE "profissionais" DROP COLUMN "aprovadoPorId";

ALTER TABLE "profissionais" ADD COLUMN "coordenador" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profissionais" ADD COLUMN "aprovadoEm" DATETIME;
ALTER TABLE "profissionais" ADD COLUMN "aprovadoPorId" INTEGER;
