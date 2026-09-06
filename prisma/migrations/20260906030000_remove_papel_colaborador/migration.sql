-- O papel LEITOR nunca concedeu nada: a única decisão que dependia do papel era
-- `podeEditarCurso`, que exigia EDITOR, e todo usuário autenticado já podia ver
-- qualquer curso. Conceder LEITOR dava exatamente o acesso que a pessoa já
-- tinha. Liberar acesso passa a significar acesso total ao curso, então o papel
-- deixa de existir.

ALTER TABLE "curso_colaboradores" DROP COLUMN "papel";

ALTER TABLE "curso_access_requests" DROP COLUMN "papel_solicitado";

DROP TYPE "PapelColaborador";
