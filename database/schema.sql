-- Schema para o Gerador de Cursos
-- Este arquivo define a estrutura do banco de dados

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS cursos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  carga_horaria TEXT,
  modalidade TEXT,
  instrutor TEXT,
  categoria TEXT,
  duracao INTEGER,
  nivel TEXT,
  idioma TEXT DEFAULT 'pt-BR',
  versao_scorm TEXT DEFAULT '1.2',
  cor_tema TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Módulos
CREATE TABLE IF NOT EXISTS modulos (
  id TEXT PRIMARY KEY,
  curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Aulas
CREATE TABLE IF NOT EXISTS aulas (
  id TEXT PRIMARY KEY,
  modulo_id TEXT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'text', 'video', 'quiz', 'interactive'
  conteudo JSONB NOT NULL, -- Armazena o conteúdo completo da aula
  ordem INTEGER NOT NULL,
  duracao_estimada INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_modulos_curso_id ON modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_modulos_ordem ON modulos(curso_id, ordem);
CREATE INDEX IF NOT EXISTS idx_aulas_modulo_id ON aulas(modulo_id);
CREATE INDEX IF NOT EXISTS idx_aulas_curso_id ON aulas(curso_id);
CREATE INDEX IF NOT EXISTS idx_aulas_ordem ON aulas(modulo_id, ordem);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modulos_updated_at BEFORE UPDATE ON modulos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON aulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

