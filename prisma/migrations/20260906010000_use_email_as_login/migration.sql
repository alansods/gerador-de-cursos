-- O cadastro já pedia um e-mail, validava o formato e então o descartava,
-- guardando apenas o trecho antes do "@" como login. Isso colidia
-- (maria@a.com e maria@b.com viravam o mesmo "maria") e deixava o sistema sem
-- nenhum canal para recuperar senha ou notificar sobre os fluxos da Fase 2.
-- O e-mail passa a ser o próprio login.

ALTER TABLE "users" RENAME COLUMN "usuario" TO "email";

-- Logins existentes não são e-mails (admin, convidado). Recebem um domínio
-- para satisfazer o novo formato; troque pelo domínio real quando quiser.
UPDATE "users" SET "email" = "email" || '@senai.br' WHERE "email" NOT LIKE '%@%';

ALTER INDEX "users_usuario_key" RENAME TO "users_email_key";
ALTER INDEX "users_usuario_idx" RENAME TO "users_email_idx";
