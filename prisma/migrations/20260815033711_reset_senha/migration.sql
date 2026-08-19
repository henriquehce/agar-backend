-- AlterTable
ALTER TABLE "gestantes" ADD COLUMN     "resetSenhaExpira" TIMESTAMP(3),
ADD COLUMN     "resetSenhaHash" TEXT;
