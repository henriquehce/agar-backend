-- Foto do resultado do exame (data URL base64 enviada pelo app). Antes o app ja mandava
-- anexoUrl, mas a coluna nao existia e a API descartava o anexo sem avisar.
-- Rollback: ALTER TABLE "exames" DROP COLUMN "anexoUrl";
ALTER TABLE "exames" ADD COLUMN "anexoUrl" TEXT;
