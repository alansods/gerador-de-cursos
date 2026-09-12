-- Valores gravados em coluna passam para inglês (fase 2 da padronização de nomenclatura).
-- Os nomes de tabela e coluna não mudam: o Prisma os mantém via @map/@@map.

UPDATE "activities" SET "tipo" = 'course_created' WHERE "tipo" = 'curso_criado';
UPDATE "activities" SET "tipo" = 'course_updated' WHERE "tipo" = 'curso_editado';
UPDATE "activities" SET "tipo" = 'course_deleted' WHERE "tipo" = 'curso_deletado';
UPDATE "activities" SET "tipo" = 'user_created' WHERE "tipo" = 'usuario_criado';
UPDATE "activities" SET "tipo" = 'user_updated' WHERE "tipo" = 'usuario_editado';
UPDATE "activities" SET "tipo" = 'user_deleted' WHERE "tipo" = 'usuario_deletado';
UPDATE "activities" SET "tipo" = 'access_requested' WHERE "tipo" = 'acesso_solicitado';
UPDATE "activities" SET "tipo" = 'access_approved' WHERE "tipo" = 'acesso_aprovado';
UPDATE "activities" SET "tipo" = 'access_denied' WHERE "tipo" = 'acesso_negado';
UPDATE "activities" SET "tipo" = 'access_revoked' WHERE "tipo" = 'acesso_revogado';
UPDATE "activities" SET "tipo" = 'course_submitted_for_review' WHERE "tipo" = 'curso_enviado_revisao';
UPDATE "activities" SET "tipo" = 'course_approved' WHERE "tipo" = 'curso_aprovado';
UPDATE "activities" SET "tipo" = 'course_rejected' WHERE "tipo" = 'curso_reprovado';
UPDATE "activities" SET "tipo" = 'course_commented' WHERE "tipo" = 'curso_comentado';

UPDATE "activities" SET "entity_type" = 'course' WHERE "entity_type" = 'curso';
UPDATE "activities" SET "entity_type" = 'user' WHERE "entity_type" = 'usuario';

UPDATE "cursos" SET "layout" = 'classic' WHERE "layout" = 'classico';
ALTER TABLE "cursos" ALTER COLUMN "layout" SET DEFAULT 'classic';
