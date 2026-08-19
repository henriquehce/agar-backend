-- CreateTable
CREATE TABLE "gestantes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "dataNascimento" TEXT,
    "tipoSanguineo" TEXT,
    "semanaInicial" INTEGER NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medico" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "doencas" TEXT,
    "ultimaMenstruacao" TEXT,
    "fotoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "medico" TEXT,
    "obs" TEXT,
    "realizada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoramentos" (
    "id" SERIAL NOT NULL,
    "gestanteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor1" INTEGER NOT NULL,
    "valor2" INTEGER,
    "subtipo" TEXT,
    "obs" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoramentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestantes_email_key" ON "gestantes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gestantes_cpf_key" ON "gestantes"("cpf");

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoramentos" ADD CONSTRAINT "monitoramentos_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
