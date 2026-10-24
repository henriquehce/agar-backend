-- Numero de bebes da gestacao (1 = unica, 2 = gemeos, 3 = trigemeos, 4 = quadrigemeos ou mais).
-- Rollback: ALTER TABLE "gestantes" DROP COLUMN "quantidadeBebes";
ALTER TABLE "gestantes" ADD COLUMN "quantidadeBebes" INTEGER NOT NULL DEFAULT 1;
