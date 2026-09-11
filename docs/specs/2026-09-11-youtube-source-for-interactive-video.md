# YouTube como fonte do vídeo interativo

## Descrição

O bloco `video-interativo` ([spec anterior](2026-09-10-video-upload-and-interactive-video.md))
aceita hoje apenas arquivo enviado. Esta mudança acrescenta a opção de apontar para um vídeo do
YouTube, com o mesmo seletor de fonte que o bloco `video` simples já tem, mantendo intactos o
comportamento das perguntas, os marcadores na linha do tempo e o envio da nota ao LMS.

## Objetivo

Os conteudistas já mantêm vídeo no canal da instituição. Obrigá-los a baixar o arquivo e
reenviá-lo cria trabalho duplicado, duplica o armazenamento no Blob e — pior — engorda o pacote
SCORM com um vídeo que já está hospedado. Para esse público, apontar para o link do canal é o
caminho natural.

A restrição que motivou excluir o YouTube na primeira rodada continua verdadeira, mas agora é
uma escolha informada do autor em vez de uma limitação do sistema: **vídeo do YouTube exige
internet e o domínio liberado no LMS**. O arquivo enviado continua sendo a opção que funciona
offline, e segue como padrão.

## Contexto técnico

A razão de o YouTube ter ficado de fora antes: um `<iframe>` cru não emite evento nenhum. A
**IFrame Player API** resolve isso, mas com três diferenças relevantes em relação ao `<video>`
nativo que o bloco usa hoje:

1. **Não existe `timeupdate`.** O tempo corrente só se obtém chamando `getCurrentTime()`, então o
   caminho do YouTube precisa de _polling_ (~200 ms). O caminho do arquivo continua com
   `timeupdate`, que já dispara a ~4 Hz — é o que preserva os testes existentes.
2. **A API é um script externo** (`https://www.youtube.com/iframe_api`), carregado uma vez por
   página e com _callback_ global `window.onYouTubeIframeAPIReady`. Só depois dele é possível
   instanciar `new YT.Player(...)`.
3. **Os controles são outro objeto.** Em vez de `video.pause()` / `video.currentTime`, são
   `player.pauseVideo()`, `player.seekTo(s, true)`, `player.getDuration()`, `player.mute()` /
   `unMute()`. Com `playerVars: { controls: 0, disablekb: 1 }` a barra do YouTube some e a nossa
   `ControlesVideo` continua sendo a única — o que, de quebra, elimina qualquer caminho de
   avanço que não passe pelo nosso teto.

Consequência de desenho: hoje `VideoInterativoBlock` mexe em `videoRef.current` direto e
`ControlesVideo` assina eventos do elemento. Nenhum dos dois pode continuar assim se houver duas
fontes. A refatoração faz parte do escopo — ver Requisitos.

## Decisões

| Ponto                          | Decisão                                                                              | Por quê                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Campo da fonte                 | Reusar `fonteVideo: 'youtube' \| 'arquivo'`, que já existe no tipo                   | O bloco `video` simples já usa; um campo novo duplicaria conceito e formulário                                                                                                             |
| `fonteVideo` ausente           | **Deduzir da URL**: `ehUrlYouTubeValida(videoUrl)` → `'youtube'`, senão `'arquivo'`  | Vale para os dois blocos, sem assimetria. Cobre bloco salvo antes do campo existir e, sobretudo, bloco gerado pela IA que omitiu o campo — este último não é legado, é caminho permanente  |
| Abstração entre as duas fontes | Um hook `useReprodutorVideo` devolvendo estado + comandos uniformes                  | Espalhar `if (fonte === 'youtube')` por bloco e controles duplicaria a lógica de marcos, que é a parte delicada                                                                            |
| Detecção dos marcos            | `timeupdate` para arquivo (como hoje), polling de 200 ms **só** para YouTube         | Polling uniforme obrigaria todos os testes atuais a usar timer falso, destruindo a rede de proteção que esta spec exige. O caminho validado não muda; o caminho novo é que ganha o polling |
| Controles do YouTube           | `controls: 0`, `disablekb: 1` — a barra é sempre a nossa                             | Mantém os marcadores e o teto; sem isso o aluno pularia a pergunta pela barra do YouTube                                                                                                   |
| Mídia no pacote SCORM          | Fonte `youtube` não declara mídia; fonte `arquivo` continua embutindo o vídeo        | Mesmo contrato do bloco `video`; baixar do YouTube não é possível nem permitido                                                                                                            |
| Falha ao carregar a API        | Mensagem explícita no lugar do player                                                | Num LMS sem internet o iframe hoje ficaria em branco e o aluno não saberia o que houve                                                                                                     |
| Marcador no .docx              | O marcador `VIDEOINTERATIVO` passa a aceitar URL do YouTube; a IA deduz `fonteVideo` | Mesma regra já escrita para `VIDEO`: `.mp4`/`.webm` → `arquivo`, senão `youtube`                                                                                                           |

## Requisitos

### Fonte e dados

1. O bloco `video-interativo` passa a aceitar `fonteVideo: 'youtube' | 'arquivo'`. Quando o campo
   vem ausente ou com valor fora do union, `corrigirBloco()` o deduz da URL — `'youtube'` se
   `ehUrlYouTubeValida(videoUrl)` ([youtube.ts](../../src/lib/youtube.ts)), `'arquivo'` caso
   contrário. A mesma dedução substitui o `'youtube'` fixo que hoje normaliza o bloco `video`, de
   modo que as duas normalizações fiquem iguais.

   O valor-padrão nunca é consultado para bloco criado pelo editor, porque `padroes()` já grava o
   campo. Ele existe por dois caminhos: curso salvo antes do campo existir e, de forma permanente,
   bloco vindo da IA que tenha omitido o campo.

2. Com fonte `youtube`, `videoUrl` guarda o link como o autor colou; o id é extraído por
   `extractYouTubeId` ([youtube.ts](../../src/lib/youtube.ts)), que já cobre `watch?v=`,
   `youtu.be`, `/embed/` e `/v/`.
3. `validarFormulario` adapta a mensagem à fonte — "Envie o arquivo de vídeo" ou "Adicione o link
   do vídeo do YouTube" — e, na fonte `youtube`, recusa link do qual não se extraia um id.
4. `extrairMidias` devolve `[]` na fonte `youtube` e `[videoUrl]` na fonte `arquivo`;
   `reescreverMidias` é a contraparte simétrica. O teste que cobra o par continua valendo.

### Reprodução

5. Um hook `useReprodutorVideo` encapsula as duas fontes e expõe a mesma superfície: estado
   (`tempo`, `duracao`, `tocando`, `mudo`, `pronto`, `erro`) e comandos (`reproduzir`, `pausar`,
   `buscar`, `alternarSom`).
6. O hook carrega `https://www.youtube.com/iframe_api` **uma única vez por página**, mesmo com
   vários blocos, encadeando em `window.onYouTubeIframeAPIReady` sem sobrescrever um callback já
   registrado.
7. O player do YouTube é criado com `playerVars: { controls: 0, disablekb: 1, rel: 0, playsinline: 1, modestbranding: 1 }`.
8. A detecção dos marcos passa a ler o estado do hook, não `videoRef`. O bloco deixa de usar
   `onTimeUpdate` e `onSeeking` do elemento.
9. `ControlesVideo` vira componente apresentacional: recebe estado e comandos por props, em vez de
   assinar eventos do `<video>`. Marcadores, teto na próxima pergunta pendente, trecho escurecido e
   navegação por teclado ficam como estão.
10. Se `buscar` for chamado com valor acima do teto, o hook prende no teto — a regra de bloqueio
    vive no hook, valendo para as duas fontes.
11. Se a API não carregar em até 10 s, ou se `onError` disparar, o bloco mostra "Não foi possível
    carregar o vídeo do YouTube. Verifique a conexão com a internet." no lugar do player.

### Autoria

12. O `case 'video-interativo'` do drawer ganha o mesmo `Select` de fonte do `case 'video'`;
    trocar a fonte limpa `videoUrl`.
13. Na fonte `youtube`, o drawer exibe um aviso de que o vídeo **não** será embutido no pacote e
    exigirá internet no LMS.
14. A pré-visualização do drawer respeita a fonte.

### Geração por IA

15. A seção de conversão do marcador em
    [generate-course-from-text/route.ts](../../src/app/api/generate-course-from-text/route.ts)
    passa a instruir, para `VIDEOINTERATIVO`, a mesma dedução já escrita para `VIDEO`: URL
    terminada em `.mp4`/`.webm` → `fonteVideo: "arquivo"`, caso contrário `"youtube"`.
16. O esquema JSON do bloco no prompt inclui `fonteVideo`.
17. A proibição do bloco no modo `auto` permanece — os tempos das perguntas têm de vir do
    documento.

## Riscos

- **Regressão no que já funciona.** O caminho do arquivo enviado está validado e em uso; a
  refatoração para o hook mexe nele. Os 14 testes atuais de `video-interativo-block.test.tsx` são a
  rede de proteção e devem passar sem afrouxar asserção.
- **Testar YouTube em jsdom.** `YT.Player` não existe no ambiente de teste. O hook precisa ser
  testável com um duplo de `window.YT`, e é isso que os testes novos devem exercitar — não a API
  real.
- **Autoplay após responder.** `playVideo()` vem de um clique do aluno em "Continuar", então é
  gesto de usuário válido; se ainda assim o navegador recusar, o aluno usa o play da nossa barra.

## Fora de escopo

- Vimeo ou qualquer outro provedor.
- Vídeo não listado ou privado do YouTube, que exige o domínio autorizado no canal.
- Reidratar as respostas do aluno após recarregar a página — segue valendo o que a spec anterior
  registrou.

## Checklist

### Dados e catálogo

- [x] `fonteVideo` aceito no `video-interativo`, com `corrigirBloco()` deduzindo a fonte da URL
      via `ehUrlYouTubeValida` — a mesma dedução aplicada também ao bloco `video`
      ([blocos.ts](../../src/lib/blocos.ts))
- [x] `validarFormulario` com mensagem por fonte e recusa de link do YouTube sem id extraível
- [x] `extrairMidias` / `reescreverMidias` condicionais à fonte

### Reprodução

- [x] `src/hooks/useReprodutorVideo.ts` com as duas fontes atrás de uma superfície só
- [x] Carga única do `iframe_api` por página, encadeando `onYouTubeIframeAPIReady`
- [x] Polling de 200 ms no ramo YouTube do hook; o ramo do arquivo segue em `timeupdate`
- [x] Teto de busca movido para o hook
- [x] `ControlesVideo` convertido em apresentacional (estado e comandos por props)
- [x] Mensagem de falha quando a API não carrega ou `onError` dispara

### Autoria e IA

- [x] `Select` de fonte no `case 'video-interativo'` do drawer, com aviso sobre o pacote offline
- [x] Pré-visualização respeitando a fonte
- [x] `fonteVideo` no esquema JSON e na conversão do marcador `VIDEOINTERATIVO` no prompt

### Testes

- [x] Os 15 testes de `video-interativo-block.test.tsx` passando sem alteração de asserção
- [x] Testes do hook com duplo de `window.YT`: criação do player, polling disparando o marco,
      `seekTo` preso no teto, erro de carregamento
- [x] `blocos.test.ts`: as duas fontes em `extrairMidias` / `reescreverMidias` e as mensagens de
      `validarFormulario`
- [x] `content-block-drawer.test.tsx`: troca de fonte no bloco interativo

### Fechamento

- [x] `pnpm build` limpo, `pnpm test` verde, player Vite compilando
- [x] Verificado em navegador (Playwright sobre o player Vite): as 20 checagens da fonte arquivo
      seguem passando; no YouTube a duração chega por polling, o pino aparece, a pergunta dispara
      durante a reprodução, a nota é registrada e o pino fica verde; com o domínio do YouTube
      bloqueado aparece a mensagem de falha
- [ ] Falta: exportar um SCORM real e conferir que só o vídeo enviado entra em `images/`

## Verificação

```bash
pnpm build
pnpm test
```

No navegador, com `pnpm dev`:

1. Criar um `video-interativo` com fonte YouTube, colar um link do canal e cadastrar duas
   perguntas; conferir que os losangos aparecem na barra assim que a duração é conhecida.
2. Reproduzir: o vídeo pausa no marco, a pergunta cobre o player, responder libera.
3. Tentar arrastar além do marco pendente — a barra deve parar nele; a barra do YouTube não pode
   aparecer em momento algum.
4. Repetir com um bloco de fonte arquivo na mesma unidade, para confirmar que os dois convivem.
5. Exportar o SCORM e conferir que apenas o vídeo enviado está em `images/`, e que o bloco do
   YouTube manteve a URL original.
6. Abrir o pacote com a rede desligada e confirmar que aparece a mensagem de falha, não um
   quadro em branco.
