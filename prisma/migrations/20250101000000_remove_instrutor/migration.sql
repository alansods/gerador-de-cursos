-- Apagar todos os cursos existentes
DELETE FROM cursos;

-- Remover coluna instrutor
ALTER TABLE cursos DROP COLUMN IF EXISTS instrutor;

