# Vídeo por upload e bloco `video-interativo`

## Descrição

O bloco `video` aceitava apenas link do YouTube e renderizava um `<iframe>` cru. Esta mudança
acrescenta duas capacidades:

- **A.** O autor pode enviar um arquivo de vídeo do computador, e esse arquivo passa a ser embutido
  no pacote SCORM como já acontece com áudio, PDF e imagem.
- **B.** Um novo tipo de bloco, `video-interativo`, pausa o vídeo em marcos de tempo definidos pelo
  autor, exibe uma pergunta de múltipla escolha e só retoma a reprodução depois da resposta. O
  resultado entra na nota enviada ao LMS.

## Objetivo

Dois problemas motivam a mudança.

O primeiro é de disponibilidade: um `<iframe>` do YouTube exige internet e o domínio liberado no
LMS. Num ambiente fechado — comum em unidades industriais — o vídeo simplesmente não aparece, e o
pacote SCORM não tem como se defender disso porque o bloco `video` nunca embutiu arquivo nenhum.

O segundo é pedagógico: hoje o aluno assiste ao vídeo de forma passiva e não há nenhum sinal de que
ele de fato acompanhou. Perguntas ancoradas em timestamps transformam o vídeo em atividade
avaliativa, no mesmo canal de nota que `quiz`, `associacao` e `categorizacao` já usam.

A escolha de `<video>` nativo em vez da YouTube IFrame API resolve os dois de uma vez: o elemento
nativo emite `timeupdate` e `seeking`, permite `pause()` por código, e funciona offline dentro do
pacote.

## Decisões

| Ponto                                                                               | Decisão                                                                                                                  | Por quê                                                                                                                               |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Comportamento no timestamp                                                          | Pausa e bloqueia, inclusive impedindo arrastar a barra além de uma pergunta não respondida                               | É o padrão consagrado de vídeo interativo (H5P, Edpuzzle); sem o bloqueio do avanço a pergunta vira decoração                         |
| Nota                                                                                | Conta, via `useRegistrarQuiz(blocoIndex)`                                                                                | Reusa o canal já existente; a nota agregada continua sendo média de acertos/total                                                     |
| Estrutura                                                                           | Tipo novo `video-interativo`, em vez de estender `video`                                                                 | O bloco `video` está em produção; misturar mídia e avaliação no mesmo tipo confundiria categoria, validação e nota                    |
| Fonte do vídeo interativo                                                           | Somente arquivo enviado                                                                                                  | A YouTube IFrame API é script externo com carga assíncrona e exige internet — justamente o cenário que a feature precisa cobrir       |
| Alternativas                                                                        | 2 a 5 por pergunta; errar mostra o feedback e libera o vídeo                                                             | Obrigar o acerto faz todo mundo acertar por tentativa e erro, o que esvazia a nota                                                    |
| UI                                                                                  | Overlay próprio, uma pergunta por vez                                                                                    | `QuizConteudo` é um fluxo multi-pergunta com tela de resultado; adaptá-lo exigiria reescrever componente em produção                  |
| Marcador no .docx                                                                   | `VIDEOINTERATIVO`, apenas no modo `markers`                                                                              | Os timestamps precisam vir do documento — a IA não assiste ao vídeo e inventaria os tempos no modo `auto`                             |
| Limites de upload                                                                   | `video/mp4`, `video/webm`; 100 MB rígido, 25 MB recomendado                                                              | Mantém o pacote SCORM na faixa amarela de `faixaPesoPacote` no pior caso, respeitando o teto de upload da maioria dos LMS             |
| Campos da pergunta achatados (`opcaoA`…`opcaoE` + `correta`) em vez de `QuizItem[]` | O `EditorDeItens` genérico não edita lista dentro de lista, e o drawer é o único ponto da UI sem cobertura do compilador | Formato espelha o marcador no .docx; o custo é feedback por pergunta em vez de por alternativa, aceitável porque errar libera o vídeo |

## Requisitos

### Parte A — upload de vídeo

1. `POLITICA_MIDIAS` ganha a categoria `video`: `video/mp4` e `video/webm`, limite rígido de 100 MB,
   recomendado de 25 MB.
2. O bloco `video` ganha `fonteVideo: 'youtube' | 'arquivo'`. Ausente equivale a `'youtube'`, para
   que cursos já salvos continuem válidos.
3. Com fonte `arquivo`, o bloco renderiza `<video controls preload="metadata">` sem autoplay; com
   fonte `youtube`, o `<iframe>` de hoje, inalterado.
4. Com fonte `arquivo`, o bloco declara `extrairMidias` e `reescreverMidias`, de modo que o arquivo
   entre no ZIP e a URL seja reescrita para o caminho local. Com fonte `youtube`, extrai nada.
5. O drawer oferece um seletor de fonte; trocar a fonte limpa a URL anterior.

### Parte B — bloco `video-interativo`

1. Aceita somente arquivo enviado, com título obrigatório.
2. O autor cadastra N perguntas, cada uma com tempo (`mm:ss` ou `hh:mm:ss`), enunciado, de 2 a 5
   alternativas, a indicação de qual é a correta e um feedback opcional.
3. Dois marcos não podem ter o mesmo tempo.
4. Durante a reprodução, ao alcançar o tempo de uma pergunta ainda não respondida, o vídeo pausa e a
   pergunta cobre o player.
5. Tentar avançar além de uma pergunta não respondida devolve a reprodução para o tempo dessa
   pergunta e a abre.
6. Responder mostra certo/errado mais o feedback; o botão de continuar retoma a reprodução,
   independentemente do acerto.
7. A cada resposta o bloco reporta o acumulado `{ acertos, total }`, que vira `cmi.core.score.raw`
   pelo caminho já existente.
8. O bloco pode ser gerado a partir do marcador `VIDEOINTERATIVO_INICIO`…`VIDEOINTERATIVO_FIM` no
   modo `markers`, e é explicitamente proibido no modo `auto`.

### Marcadores na linha do tempo

Acrescentado depois da primeira rodada, a pedido: o aluno precisa ver antes onde estão as
perguntas.

A timeline do `<video controls>` não é estilizável em navegador nenhum, então o `controls`
nativo foi substituído por uma barra própria em
`src/components/course/blocks/ControlesVideo.tsx` — play/pause, tempo, mudo, tela cheia e um
scrubber com um losango por pergunta, âmbar quando pendente e verde quando respondida, com
`title` informando o tempo.

O ganho colateral é no bloqueio: em vez de deixar arrastar e puxar de volta, a barra tem um
teto (`limiteSegundos`) na próxima pergunta pendente e o arrasto simplesmente para ali; o
trecho travado aparece escurecido. Voltar para trás continua livre. O guarda `onSeeking` no
bloco foi mantido como defesa em profundidade, para busca programática.

O componente é separado do `VideoInterativoBlock` para que o bloco continue tratando só das
perguntas. A barra é acessível por teclado (`role="slider"`, setas, Home/End, espaço) porque
sem o `controls` nativo não há outro caminho de teclado.

### Fora de escopo

As respostas não sobrevivem a um reload da página — apenas acertos/total vão para o `suspend_data`,
como já ocorre com `quiz` e `associacao`. Reidratar respostas individuais exigiria repensar o
orçamento de 4 KB do `suspend_data` e vale como mudança separada.

## Checklist

### Parte A

- [x] Categoria `video` em `POLITICA_MIDIAS` (`src/lib/midias.ts`)
- [x] `fonteVideo` no tipo do bloco (`src/types/gerador-curso.ts`)
- [x] Catálogo do `video`: `padroes`, `validarFormulario`, `extrairMidias`, `reescreverMidias`
      (`src/lib/blocos.ts`) e `fonteVideo` em `baseBloco()`
- [x] `VideoBlock.tsx` ramifica por fonte
- [x] `case 'video'` do drawer com seletor de fonte e `CampoArquivo`
- [x] `blocos.test.ts`: remover `video` da lista `somenteStreaming` e cobrir as duas fontes

### Parte B

- [x] `'video-interativo'` no union e `PerguntaVideo` (`src/types/gerador-curso.ts`)
- [x] `segundosDeTempo` em `src/lib/tempo-video.ts` + teste
- [x] Entrada em `CATALOGO_BLOCOS`, mais `corrigirBloco()` e `motivoInvalido()`
- [x] `VideoInterativoBlock.tsx` + `registry.ts` + `index.ts`
- [x] `case 'video-interativo'` no `renderForm()` do drawer
- [x] Marcador em `documento-exemplo.ts`
- [x] Três seções do prompt em `generate-course-from-text/route.ts`
- [x] Testes em `blocos.test.ts`, `content-block-drawer.test.tsx` e
      `video-interativo-block.test.tsx` (pausa, bloqueio do avanço e acúmulo da nota)
- [x] `ControlesVideo.tsx` com os marcadores no scrubber e o teto na pergunta pendente
- [x] `pnpm build` limpo, `pnpm test` verde (344 testes), player Vite compilando o bloco novo
- [ ] Verificação manual no navegador: criar o bloco, enviar um MP4, reabrir no editor e
      exportar o SCORM conferindo o `.mp4` dentro de `images/` no ZIP
