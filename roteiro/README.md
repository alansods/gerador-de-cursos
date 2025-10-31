# 📚 Roteiro de Criação de Cursos com IA

Esta pasta contém templates e exemplos para criar cursos usando inteligência artificial.

## 🎯 Como Usar

1. **Baixe um template**: Use `template-curso.md` como base
2. **Preencha o conteúdo**: Siga a estrutura do template
3. **Upload no sistema**: Vá em "Novo Curso" → "Gerar por IA"
4. **Aguarde processamento**: A IA vai estruturar automaticamente (30-60s)
5. **Revise e edite**: Faça ajustes finais no editor

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

### Opção 1: URLs (Recomendado)
```markdown
![Descrição da imagem](https://exemplo.com/imagem.png)
```

### Opção 2: Placeholder (IA sugere)
```markdown
[IMAGEM: Descrição detalhada do que a imagem deve mostrar]
```

**Nota:** Após a geração, você pode editar e adicionar as URLs reais das imagens no editor.

## 📏 Limites de Tamanho

| Tamanho | Status | Recomendação |
|---------|--------|--------------|
| < 5 MB | ✅ Ideal | Processamento rápido (10-20s) |
| 5-10 MB | ⚠️ Grande | Aceito, mas pode demorar (30-60s) |
| > 10 MB | ❌ Muito grande | Reduzir documento |

## ✅ Boas Práticas

- ✅ Use títulos claros e hierárquicos (`#`, `##`, `###`)
- ✅ Divida conteúdo em seções lógicas
- ✅ Escreva descrições detalhadas das unidades
- ✅ Use listas e bullet points para facilitar leitura
- ✅ Inclua exemplos práticos
- ✅ Mantenha parágrafos curtos (3-5 linhas)
- ✅ Comece sempre com os metadados

## 🚫 Evite

- ❌ Documentos sem estrutura clara
- ❌ Textos muito longos sem quebras de seção
- ❌ Falta de metadados no início
- ❌ Menos de 3 unidades
- ❌ Unidades sem descrição
- ❌ Imagens muito grandes (use URLs otimizadas)

## 📁 Exemplos Inclusos

- **`template-curso.md`** - Template básico para começar
- **`exemplo-curso-nextjs.md`** - Curso completo de Next.js
- **`exemplo-curso-python.md`** - Curso completo de Python

## 💡 Dicas para Reduzir Tamanho

Se seu documento for muito grande (> 10MB):

1. **Remova imagens desnecessárias** do documento
2. **Use URLs de imagens** em vez de incorporar
3. **Comprima imagens** antes de inserir (JPG 70-80% qualidade)
4. **Divida em múltiplos documentos** menores
5. **Use ferramentas online**:
   - PDF: [iLovePDF](https://www.ilovepdf.com/pt/comprimir_pdf)
   - PDF: [Smallpdf](https://smallpdf.com/pt/comprimir-pdf)

## 🎓 Formatos Aceitos

| Formato | Extensão | Recomendado |
|---------|----------|-------------|
| PDF | `.pdf` | ✅ Sim |
| Word | `.docx` | ✅ Sim |
| Texto | `.txt` | ✅ Sim (Markdown) |

## 🤖 Como a IA Processa

1. **Extrai metadados** do início do documento
2. **Identifica unidades** através dos títulos `# UNIDADE X:`
3. **Captura descrições** das seções `## Descrição da Unidade`
4. **Estrutura conteúdo**:
   - `## Título` → tipo "titulo"
   - `### Subtítulo` → tipo "subtitulo"
   - Parágrafos normais → tipo "paragrafo"
   - `![texto](url)` ou `[IMAGEM:...]` → tipo "imagem"

## 📞 Precisa de Ajuda?

Se tiver dúvidas:
1. Veja os exemplos inclusos
2. Siga o template básico
3. Teste com um documento pequeno primeiro
4. O editor permite ajustes após a geração

---

**Dica:** Comece com o `template-curso.md` e use os exemplos como referência! 🚀

