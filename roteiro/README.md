# 📚 Roteiro de Criação de Cursos com IA

Esta pasta contém templates e exemplos para criar cursos usando inteligência artificial.

## 🎯 Como Usar

1. **Baixe o exemplo**: Clique em "Baixar Exemplo" na página de novo curso
2. **Edite no Word ou Google Docs**: Mantenha a estrutura e adicione seu conteúdo
3. **Salve como .docx**: Se usar Google Docs, faça download como Word (.docx)
4. **Upload no sistema**: Vá em "Novo Curso" → "Gerar por IA"
5. **Aguarde processamento**: A IA vai estruturar automaticamente (30-60s)
6. **Revise e edite**: Faça ajustes finais no editor

## 📋 Estrutura do Documento

### ✅ Metadados (Obrigatório no início)

```
# METADADOS DO CURSO
**Título:** Nome do Curso
**Categoria:** Programação/Design/Marketing/Negócios
**Carga Horária:** X horas
**Modalidade:** Online/Presencial/Híbrido
**Instrutor:** Nome do Instrutor

## DESCRIÇÃO DO CURSO
[Parágrafo explicando o que os alunos aprenderão]
```

### ✅ Unidades (Mínimo 3)

```
# UNIDADE 1: Título da Unidade

## Descrição da Unidade
[Breve descrição do que será aprendido - OBRIGATÓRIO]

## Introdução
[Conteúdo introdutório]

### Tópico 1.1: Nome do Subtópico
[Conteúdo explicativo...]

### Tópico 1.2: Nome do Subtópico
[Conteúdo explicativo...]
```

## 🖼️ Incluindo Imagens

### Como adicionar no Word/Google Docs:

1. **Insira a imagem diretamente** no documento (será processada como placeholder)
2. **Ou use texto descritivo**: `[IMAGEM: Descrição detalhada do que a imagem mostra]`

**Nota:** Após a geração, você pode editar e adicionar as imagens reais no editor do sistema.

## 📏 Limites de Tamanho

| Tamanho | Status | Recomendação |
|---------|--------|--------------|
| < 5 MB | ✅ Ideal | Processamento rápido (10-20s) |
| 5-10 MB | ⚠️ Grande | Aceito, mas pode demorar (30-60s) |
| > 10 MB | ❌ Muito grande | Reduzir documento |

## ✅ Boas Práticas

- ✅ Use **estilos de título** do Word/Google Docs (Título 1, Título 2, Título 3)
- ✅ Divida conteúdo em seções lógicas e bem estruturadas
- ✅ Escreva descrições detalhadas das unidades (obrigatório)
- ✅ Use listas e bullet points para facilitar leitura
- ✅ Inclua exemplos práticos e didáticos
- ✅ Mantenha parágrafos curtos (3-5 linhas)
- ✅ Comece sempre com os metadados em negrito

## 🚫 Evite

- ❌ Documentos sem usar estilos de título
- ❌ Textos muito longos sem quebras de seção
- ❌ Falta de metadados no início
- ❌ Menos de 3 unidades
- ❌ Unidades sem descrição (obrigatório)
- ❌ Imagens muito pesadas incorporadas (> 2MB cada)
- ❌ Tabelas muito complexas (use listas simples)

## 📁 Exemplos Inclusos

- **`exemplo-curso-nextjs.docx`** - Curso completo de Next.js (formato Word)
- **`template-curso.md`** - Template de referência (use o .docx baixado do sistema)
- **`exemplo-curso-nextjs.md`** - Versão Markdown de referência
- **`exemplo-curso-python.md`** - Versão Markdown de referência

## 💡 Dicas para Reduzir Tamanho

Se seu documento for muito grande (> 10MB):

1. **Remova imagens desnecessárias** do documento
2. **Comprima imagens** antes de inserir (JPG 70-80% qualidade)
3. **Divida em múltiplos documentos** menores (um curso por vez)
4. **No Google Docs**: File → Download → Microsoft Word (.docx)
5. **Evite** incorporar vídeos ou arquivos pesados

## 🎓 Formatos Aceitos

| Formato | Extensão | Status |
|---------|----------|--------|
| Word 2007+ | `.docx` | ✅ **Recomendado** |
| Word 97-2003 | `.doc` | ✅ Aceito |
| Google Docs | Download como .docx | ✅ Perfeito! |

## 🤖 Como a IA Processa

1. **Extrai metadados** do início do documento (palavras em negrito)
2. **Identifica unidades** através de **Título 1** ou texto "UNIDADE X:"
3. **Captura descrições** das seções com **Título 2**
4. **Estrutura conteúdo**:
   - **Título 1** → Unidade principal
   - **Título 2** → Seções da unidade
   - **Título 3** → Subtópicos
   - Parágrafos normais → Conteúdo
   - Listas → Mantidas como parágrafos

## 📞 Precisa de Ajuda?

Se tiver dúvidas:
1. Veja os exemplos inclusos
2. Siga o template básico
3. Teste com um documento pequeno primeiro
4. O editor permite ajustes após a geração

---

**Dica:** Comece com o `template-curso.md` e use os exemplos como referência! 🚀

