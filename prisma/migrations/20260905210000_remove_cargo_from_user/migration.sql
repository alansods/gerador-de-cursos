-- `cargo` sempre representou permissão na plataforma, não o cargo da pessoa na
-- empresa, então duplicava o papel de `role`. A migration anterior
-- (20260905120000_add_user_roles_and_curso_ownership) já derivou `role` a partir
-- de `cargo` para todas as linhas existentes, então nenhum dado de permissão se
-- perde aqui.

-- Rede de segurança: se alguma linha ficou com o papel padrão apesar de um cargo
-- que indicava outra coisa, corrige antes de remover a coluna de origem.
UPDATE "users" SET "role" = 'ADMIN'
  WHERE "cargo" = 'Administrador' AND "role" <> 'ADMIN';

UPDATE "users" SET "role" = 'CONVIDADO'
  WHERE "cargo" = 'Convidado' AND "role" <> 'CONVIDADO';

ALTER TABLE "users" DROP COLUMN "cargo";
