-- AlterTable
ALTER TABLE "gestantes" ADD COLUMN     "consentimentoNotificacoes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentimentoPesquisa" BOOLEAN NOT NULL DEFAULT false;
