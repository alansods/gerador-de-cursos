-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'GESTOR', 'CONTEUDISTA', 'REVISOR', 'CONVIDADO');

-- CreateEnum
CREATE TYPE "StatusCurso" AS ENUM ('EM_ANDAMENTO', 'EM_REVISAO', 'APROVADO', 'REPROVADO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "RoleUsuario" NOT NULL DEFAULT 'CONTEUDISTA';

-- Backfill: deriva o papel a partir do campo textual "cargo" existente
UPDATE "users" SET "role" = CASE
  WHEN "cargo" = 'Administrador' THEN 'ADMIN'::"RoleUsuario"
  WHEN "cargo" = 'Convidado' THEN 'CONVIDADO'::"RoleUsuario"
  ELSE 'CONTEUDISTA'::"RoleUsuario"
END;

-- AlterTable
ALTER TABLE "cursos"
  ADD COLUMN "status" "StatusCurso" NOT NULL DEFAULT 'EM_ANDAMENTO',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "owner_id" TEXT,
  ADD COLUMN "revisado_por_id" TEXT,
  ADD COLUMN "revisado_em" TIMESTAMP(3);

-- Backfill: dono do curso = autor da atividade "curso_criado" mais antiga do curso
UPDATE "cursos" c
SET "owner_id" = a."user_id"
FROM (
  SELECT DISTINCT ON ("entity_id") "entity_id", "user_id"
  FROM "activities"
  WHERE "tipo" = 'curso_criado'
    AND "entity_id" IS NOT NULL
    AND "user_id" IS NOT NULL
  ORDER BY "entity_id", "created_at" ASC
) a
WHERE c."id" = a."entity_id";

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "cursos_owner_id_idx" ON "cursos"("owner_id");

-- CreateIndex
CREATE INDEX "cursos_status_idx" ON "cursos"("status");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_revisado_por_id_fkey" FOREIGN KEY ("revisado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
