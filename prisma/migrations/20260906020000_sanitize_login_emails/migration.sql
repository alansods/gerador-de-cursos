-- A migration anterior anexou "@senai.br" aos logins antigos sem sanitizar o
-- trecho local. Logins com espaço (ex.: "Alan conteudista") viraram e-mails
-- inválidos, que a validação de formato recusa no login e na edição.
--
-- Idempotente: só toca em linhas cujo e-mail ainda não tem formato válido.
UPDATE "users"
SET "email" = regexp_replace(lower(trim(split_part("email", '@', 1))), '\s+', '.', 'g') || '@senai.br'
WHERE "email" !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$';
