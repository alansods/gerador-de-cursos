# Geração de curso por IA: limites de tempo

## Contexto

Gerar um curso a partir de um `.docx` falhava de duas formas:

- Em produção, "API de IA não configurada": `GEMINI_API_KEY` só estava no ambiente
  Preview da Vercel. Corrigido no painel (Preview + Production) e com redeploy. Não
  envolve código.
- Localmente, "O documento é grande demais para uma geração única. Divida o conteúdo em
  partes menores e tente novamente." A mensagem não tem relação com o tamanho do
  documento: é o `AbortController` de 55 s em `src/app/(app)/courses/new/actions.ts`
  cancelando a requisição.

### Medição

Roteiro real (`roteiro-curso-doces regionais.docx`, ~1.900 palavras, modo `auto`),
`gemini-2.5-flash`, mesmo prompt da rota:

| Configuração               | Tempo  | Tokens de raciocínio | Tokens de saída | Blocos |
| -------------------------- | ------ | -------------------- | --------------- | ------ |
| Thinking padrão (dinâmico) | 60,2 s | 4.245                | 10.397          | 39     |
| Thinking desligado         | 35,3 s | 0                    | 8.362           | 23     |

- O tempo é dominado pela saída: a IA escreve o JSON do curso inteiro a ~250 tokens/s,
  então cresce junto com o tamanho do curso.
- Sem thinking o texto fica parecido (~9% menor), mas a escolha dos blocos piora: as
  receitas viraram 2 `tabs` em vez de 8 `technical-sheet`. No modo `auto` o thinking
  tem valor e não deve ser desligado.
- Os cursos previstos têm esse tamanho ou são um pouco maiores.

### Limites em jogo

| Onde                                     | Hoje  |
| ---------------------------------------- | ----- |
| Navegador (`GENERATION_TIMEOUT`)         | 55 s  |
| Rota (`export const maxDuration`)        | 60 s  |
| Projeto na Vercel (Default Max Duration) | 300 s |

O projeto `gerador-de-cursos-v2` está no plano Hobby com Fluid compute ativo, que
permite até 300 s. O limite de 60 s vem da própria rota, que sobrescreve o padrão do
projeto para baixo.

## Decisões

- **Rota:** `maxDuration = 300` em
  `src/app/api/generate-course-from-text/route.ts`.
- **Navegador:** `GENERATION_TIMEOUT` passa a 310 s, um pouco acima do limite da
  função, para que o corte venha da Vercel e não do navegador. A mensagem do abort
  deixa de culpar o tamanho do documento e passa a dizer que a geração excedeu o tempo
  limite.
- **Thinking limitado:** `generationConfig.thinkingConfig.thinkingBudget` com valor
  fixo no lugar do thinking dinâmico.
  - O SDK `@google/generative-ai@0.24.1` não declara `thinkingConfig` nos tipos, mas
    repassa o campo para a API (verificado: budget 0 → 0 tokens de raciocínio; budget
    256 → 208). Não é preciso migrar para `@google/genai`; basta ajustar o tipo.
  - **Budget: 2048.** Medição com o mesmo roteiro (uma execução por configuração):

    | Budget | Tempo  | Tokens de raciocínio | Blocos | `technical-sheet` | Descartados |
    | ------ | ------ | -------------------- | ------ | ----------------- | ----------- |
    | 1024   | 33,9 s | 951                  | 18     | 0                 | 5           |
    | 2048   | 47,2 s | 1.749                | 39     | 8                 | 0           |

    2048 mantém a estrutura do thinking dinâmico (39 blocos, 8 fichas técnicas) com
    ~13 s a menos. 1024 perde uma unidade na normalização e não usa fichas técnicas.

- A geração continua síncrona, com o usuário esperando na tela. O fluxo em segundo
  plano fica para `docs/specs/2026-09-16-async-course-generation.md`, em branch própria.

## Escopo

- `src/app/api/generate-course-from-text/route.ts` — `maxDuration` e `thinkingBudget`.
- `src/app/(app)/courses/new/actions.ts` — timeout e mensagem.
- Testes: `src/__tests__/api/generate-course-from-text.test.ts` (configuração de
  thinking enviada ao modelo) e o teste que cobre a mensagem de timeout, se houver.

## Fora do escopo

- Geração assíncrona, status na lista de cursos e aviso global.
- Lista de modelos de fallback (`gemini-2.0-flash`, `gemini-1.5-flash-latest`
  descontinuados) e fallback para OpenAI.
