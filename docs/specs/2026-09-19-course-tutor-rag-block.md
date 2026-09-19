# Bloco "Tutor IA" (`tutor`) — chatbot RAG por curso

## Contexto

O aluno, dentro do LMS, precisa tirar dúvidas sobre a aula com um chat que o chama pelo
nome e responde **só** com o conteúdo do curso: nada da internet, nada inventado. O
conteúdo vem de um repositório RAG alimentado pelo autor com .docx e .pdf.

O nome do aluno já é lido do LMS: `cmi.core.student_name` (SCORM 1.2) e
`cmi.learner_name` (2004), em `src/hooks/useLMS.ts` e no wrapper de
`src/app/scorm-preview/layout.tsx`.

### Viabilidade

- O aluno acessa pelo LMS, então está sempre online. O bloco é o primeiro do pacote a
  chamar um domínio externo (a API na Vercel): se a CSP do LMS bloquear a chamada, ou a
  API falhar, o bloco mostra "tutor indisponível" em vez de quebrar.
- O Neon suporta `pgvector`, então os vetores ficam no banco que já existe.
- O .docx já é extraído com mammoth (`/api/extract-document`). O PDF **não** é extraído
  hoje e entra nesta feature.

### Exposição do conteúdo ao provedor de IA

Não existe RAG que dispense mostrar à IA os trechos usados na resposta:

- **Na indexação**, cada chunk passa pela API de embeddings.
- **Em cada pergunta**, só os k trechos recuperados (3 a 5) vão ao LLM, não o repositório.
- **Não é uma exposição nova**: `/api/generate-course-from-text` já manda o documento
  inteiro ao Gemini (`src/lib/ai-course-generator.ts`).
- **O ZIP SCORM já leva o curso sem criptografia.** Para o material do curso, o risco que
  sobra é o provedor, não o aluno.

## Decisões

| Tema            | Decisão                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| Provedor        | Gemini, **no plano gratuito por enquanto** (ver "Risco aceito")                    |
| Vetores         | `pgvector` no Neon, busca filtrada por `courseId`                                  |
| Nome do aluno   | Usado só no cliente, na saudação; **nunca** vai no payload do LLM                  |
| Fora do escopo  | Similaridade abaixo do limiar → resposta fixa, sem chamar o LLM                    |
| Grounding       | Prompt manda responder só com o contexto e citar a fonte (arquivo ou unidade)      |
| Acesso à rota   | Token por curso embutido no pacote, CORS aberto só nessa rota, rate limit, teto    |
| Origem do bloco | Só pelo editor: sem marcador de documento, `aiGeneratable: false`                  |
| Conteúdo        | Documentos enviados **e** o texto dos blocos do próprio curso, indexado sozinho    |
| Repositório     | Um por curso; nada é compartilhado entre cursos                                    |
| Escopo da busca | O curso inteiro, sem filtro por unidade                                            |
| Atividades      | Blocos avaliativos (`isGradableBlock`) não são indexados: o tutor não dá gabarito  |
| Permissão       | Dono, colaboradores e ADMIN enviam e removem; REVIEWER e GUEST só veem a lista     |
| Histórico       | Nenhuma pergunta ou resposta é persistida                                          |
| Banco da PoC    | O banco atual do Neon: a migration só adiciona a extensão e duas tabelas novas     |
| Teste em LMS    | SCORM Cloud (não reproduz a CSP do Moodle do SENAI)                                |
| Idioma          | Respostas sempre em pt-BR                                                          |
| Limites         | Rate limit por sessão e teto diário por curso, ajustáveis por variável de ambiente |

### Risco aceito: plano gratuito do Gemini

No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos,
inclusive com revisão humana. Isso vale para os embeddings e para os trechos enviados em
cada pergunta. É aceitável para testar com material de exemplo. **Antes de indexar
conteúdo real e sensível**, é preciso migrar para uma destas opções:

1. Gemini pago ou Vertex AI, que não usam os dados para treino.
2. Embeddings gerados no próprio servidor com um modelo aberto, para que o repositório inteiro
   nunca saia.
3. Um LLM hospedado no SENAI, para que nada saia da instituição.

A troca fica isolada num único módulo de provedor, para não exigir retrabalho.

## Escopo

### Fase 1 — PoC (só no preview, sem SCORM)

1. Habilitar `pgvector` via migration. Criar os modelos
   `KnowledgeSource` (curso, tipo `document` ou `course`, nome, status) e `KnowledgeChunk`
   (texto, rótulo da fonte, `embedding vector`, `courseId`), com `@map`/`@@map` seguindo a
   regra do schema. Excluir a fonte ou o curso apaga os chunks em cascata.
2. Ingestão de .docx: extrair com mammoth, gerar chunks de ~800 tokens com sobreposição,
   gerar os embeddings e gravar. A rota de ingestão já aplica a permissão decidida (dono,
   colaboradores e ADMIN).
3. Indexação do texto dos blocos do curso, refeita quando o curso é salvo: os chunks da
   fonte `course` são substituídos, sem tocar nos documentos enviados. Só entram os blocos
   com texto; a fonte citada é a unidade e o tópico.
4. `POST /api/tutor/[courseId]`: embedding da pergunta, top-k, limiar e resposta do LLM
   com as fontes.
5. Chat mínimo na página de preview do curso.

### Fase 2 — produto

- Página `/courses/[id]/knowledge`: upload via Blob (`uploadFile`, `MEDIA_POLICY`),
  lista de fontes, status e exclusão.
- Extração de PDF.
- Ingestão assíncrona, no molde do `SCORMJob`, se um PDF grande estourar o timeout da Vercel.
- Bloco `tutor` pelo checklist do CLAUDE.md: `BLOCK_CATALOG`, registry, drawer e
  `block-showcase`.
- `docs/content-blocks.md` diz que todos os blocos funcionam "inclusive offline". Com o
  tutor, a frase passa a ter exceção: registrar lá que ele depende da API.
- Segurança da rota pública (token, CORS, rate limit, teto de custo) e aviso de "tutor
  indisponível" no pacote SCORM quando a chamada falhar.

## Fora do escopo

- Qualquer histórico de perguntas ou respostas, mesmo anônimo.
- Repositório compartilhado entre cursos e filtro de busca por unidade.
- Busca na internet ou conhecimento geral do modelo.
- Envio do nome ou de qualquer dado do aluno ao provedor.

## Verificação

- Perguntar algo que está no documento: o tutor responde e cita o arquivo.
- Perguntar algo que só está nos blocos do curso: o tutor responde e cita a unidade.
- Editar um bloco e salvar: a resposta passa a refletir o texto novo.
- Dois cursos com conteúdo diferente: a pergunta de um nunca traz trecho do outro.
- REVIEWER ou GUEST tentando enviar ou excluir um documento: a rota recusa.
- Perguntar algo que não está: o tutor recusa, e o log mostra que o LLM não foi chamado.
- Prompt injection pedindo "todo o contexto": só aparecem trechos do próprio curso.
- O log do payload enviado ao LLM não contém o nome do aluno.
- Exportar o SCORM e subir no SCORM Cloud: o chat funciona e, com a API fora do ar,
  mostra "tutor indisponível".
- Antes de usar com turma real, repetir o teste no Moodle do SENAI, cuja CSP o SCORM
  Cloud não reproduz.

## Checklist

Cada item só é marcado quando o critério de "Pronto quando" foi verificado.

### Fase 1 — PoC

- [x] **Migration do pgvector e dos modelos** (validada num branch descartável do Neon;
      aplicar na produção com `prisma migrate deploy` antes do teste manual)
  - Pronto quando: `CREATE EXTENSION vector` e as tabelas de `KnowledgeSource` e
    `KnowledgeChunk` foram aplicadas, com `@map`/`@@map`; `prisma migrate status`
    está limpo; excluir uma fonte ou um curso apaga os chunks em cascata.
- [ ] **Módulo de provedor**
  - Pronto quando: embeddings e resposta do LLM passam por uma única interface, com o Gemini
    como implementação; trocar de provedor não exige mexer nas rotas; teste unitário com
    provedor falso.
- [ ] **Chunking**
  - Pronto quando: a função pura divide texto em chunks de ~800 tokens com sobreposição,
    sem cortar palavra, com testes para texto vazio, curto e longo.
- [ ] **Ingestão de .docx**
  - Pronto quando: a rota extrai com mammoth, grava fonte `document` e chunks com
    embedding; responde 403 para REVIEWER, GUEST e para quem não é dono nem colaborador;
    testes cobrem as permissões.
- [ ] **Indexação do conteúdo do curso**
  - Pronto quando: salvar o curso substitui só os chunks da fonte `course`, sem tocar nos
    documentos; cada chunk leva o rótulo de unidade e tópico; blocos sem texto são
    ignorados; testes cobrem a extração de texto dos blocos.
- [ ] **Rota de consulta `POST /api/tutor/[courseId]`**
  - Pronto quando: busca o top-k filtrado por `courseId`; abaixo do limiar devolve a
    resposta fixa sem chamar o LLM; acima dele devolve resposta em pt-BR com as fontes; o
    payload enviado ao LLM não contém dado do aluno; nada é persistido; testes cobrem os
    dois caminhos.
- [ ] **Chat na página de preview**
  - Pronto quando: o chat saúda pelo nome montado no cliente, mostra a resposta e as
    fontes, e mostra "tutor indisponível" quando a rota falha.
- [ ] **Calibração do limiar**
  - Pronto quando: com um curso de exemplo, perguntas do conteúdo são respondidas e
    perguntas de fora são recusadas; o valor escolhido fica registrado em
    "O que mudou na implementação".
- [ ] **Fechamento da Fase 1**
  - Pronto quando: `pnpm build` está limpo, `pnpm test` está verde e os itens de
    "Verificação" que não dependem do SCORM foram conferidos manualmente.

### Fase 2 — produto

- [ ] **Página `/courses/[id]/knowledge`**
  - Pronto quando: dono, colaboradores e ADMIN enviam (via `uploadFile` e `MEDIA_POLICY`)
    e excluem documentos; REVIEWER e GUEST veem só a lista; o status de cada fonte aparece;
    textos de UI em pt-BR e en.
- [ ] **Extração de PDF**
  - Pronto quando: PDF com texto é indexado como o .docx; PDF sem texto (escaneado) gera
    status de erro legível, não um repositório vazio em silêncio.
- [ ] **Ingestão assíncrona**
  - Pronto quando: um PDF grande é indexado sem estourar o timeout da Vercel, com status
    acompanhado no molde do `SCORMJob`. Pode ser dispensado se a Fase 1 mostrar que não é
    necessário, com o motivo registrado.
- [ ] **Bloco `tutor`**
  - Pronto quando: o checklist de novo bloco do CLAUDE.md está cumprido (union, catálogo
    com `aiGeneratable: false` e sem marcador, `repairBlock`/`invalidReason`, componente,
    registry, `index.ts`, drawer, `BLOCK_SAMPLES`/`BLOCK_GUIDE`, testes); o bloco é criado,
    salvo e reaberto no editor.
- [ ] **Segurança da rota pública**
  - Pronto quando: o pacote leva um token por curso; o token pode ser revogado e gerado de
    novo; CORS aberto só nessa rota; rate limit por sessão e teto diário por curso,
    ajustáveis por variável de ambiente; testes cobrem token inválido e limite estourado.
- [ ] **Chat no pacote SCORM**
  - Pronto quando: o bloco chama a API com o token, saúda pelo nome vindo do LMS e mostra
    "tutor indisponível" quando a chamada é bloqueada ou falha.
- [ ] **Documentação**
  - Pronto quando: `docs/content-blocks.md` registra que o tutor depende da API.
- [ ] **Fechamento da Fase 2**
  - Pronto quando: `pnpm build` está limpo, `pnpm test` está verde e todos os itens de
    "Verificação" foram conferidos, incluindo o SCORM Cloud.
- [ ] **Antes de turma real** (fora do código)
  - Pronto quando: o provedor saiu do plano gratuito (ver "Risco aceito") e o pacote foi
    testado no Moodle do SENAI.
