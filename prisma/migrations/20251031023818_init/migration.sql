-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "carga_horaria" TEXT NOT NULL,
    "instrutor" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidades" JSONB NOT NULL DEFAULT '[]',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_modificacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cursos_titulo_idx" ON "cursos"("titulo");

-- CreateIndex
CREATE INDEX "cursos_categoria_idx" ON "cursos"("categoria");
