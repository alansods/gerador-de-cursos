-- Backup das 3 linhas de smoke-test removidas com a tabela comments (setup inicial Prisma+Neon, 31/10/2025):
--   1 | Primeiro comentário de teste!            | 2025-10-31T02:38:30.121Z
--   2 | Prisma + Neon funcionando perfeitamente! | 2025-10-31T02:38:30.241Z
--   3 | Sistema configurado com sucesso 🎉       | 2025-10-31T02:38:30.302Z

-- CreateEnum
CREATE TYPE "PapelColaborador" AS ENUM ('EDITOR', 'LEITOR');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'APROVADA', 'NEGADA', 'REVOGADA');

-- DropTable
DROP TABLE "public"."comments";

-- CreateTable
CREATE TABLE "curso_colaboradores" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "papel" "PapelColaborador" NOT NULL,
    "concedido_por_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curso_colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso_access_requests" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "solicitante_id" TEXT NOT NULL,
    "papel_solicitado" "PapelColaborador" NOT NULL DEFAULT 'EDITOR',
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "mensagem" TEXT,
    "respondido_por_id" TEXT,
    "respondido_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curso_comentarios" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "curso_colaboradores_user_id_idx" ON "curso_colaboradores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "curso_colaboradores_curso_id_user_id_key" ON "curso_colaboradores"("curso_id", "user_id");

-- CreateIndex
CREATE INDEX "curso_access_requests_status_idx" ON "curso_access_requests"("status");

-- CreateIndex
CREATE INDEX "curso_access_requests_solicitante_id_idx" ON "curso_access_requests"("solicitante_id");

-- CreateIndex
CREATE UNIQUE INDEX "curso_access_requests_curso_id_solicitante_id_key" ON "curso_access_requests"("curso_id", "solicitante_id");

-- CreateIndex
CREATE INDEX "curso_comentarios_curso_id_created_at_idx" ON "curso_comentarios"("curso_id", "created_at");

-- AddForeignKey
ALTER TABLE "curso_colaboradores" ADD CONSTRAINT "curso_colaboradores_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_colaboradores" ADD CONSTRAINT "curso_colaboradores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_colaboradores" ADD CONSTRAINT "curso_colaboradores_concedido_por_id_fkey" FOREIGN KEY ("concedido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_access_requests" ADD CONSTRAINT "curso_access_requests_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_access_requests" ADD CONSTRAINT "curso_access_requests_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_access_requests" ADD CONSTRAINT "curso_access_requests_respondido_por_id_fkey" FOREIGN KEY ("respondido_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_comentarios" ADD CONSTRAINT "curso_comentarios_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_comentarios" ADD CONSTRAINT "curso_comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

