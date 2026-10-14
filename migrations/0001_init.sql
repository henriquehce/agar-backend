
-- CreateTable
CREATE TABLE "gestantes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "nomeSocial" TEXT,
    "identidadeGenero" TEXT,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "dataNascimento" TEXT,
    "tipoSanguineo" TEXT,
    "semanaInicial" INTEGER NOT NULL,
    "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medico" TEXT,
    "alergias" TEXT,
    "medicamentos" TEXT,
    "doencas" TEXT,
    "ultimaMenstruacao" TEXT,
    "fotoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoData" DATETIME,
    "consentimentoVersao" TEXT,
    "consentimentoPesquisa" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoNotificacoes" BOOLEAN NOT NULL DEFAULT true,
    "resetSenhaHash" TEXT,
    "resetSenhaExpira" DATETIME
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "medico" TEXT,
    "obs" TEXT,
    "realizada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consultas_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monitoramentos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor1" INTEGER NOT NULL,
    "valor2" INTEGER,
    "subtipo" TEXT,
    "obs" TEXT,
    "nivelRisco" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "monitoramentos_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exames" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "realizado" BOOLEAN NOT NULL DEFAULT false,
    "dataRealizacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exames_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "registros_mensais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "peso" TEXT,
    "au" TEXT,
    "bcf" TEXT,
    "pressao" TEXT,
    "obs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "registros_mensais_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "anotacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "humor" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "anotacoes_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimentos_fetais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gestanteId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentos_fetais_gestanteId_fkey" FOREIGN KEY ("gestanteId") REFERENCES "gestantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sinais_alerta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nivel" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "borda" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "sintomas" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "logs_acesso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ip" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "gestantes_email_key" ON "gestantes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gestantes_cpf_key" ON "gestantes"("cpf");

