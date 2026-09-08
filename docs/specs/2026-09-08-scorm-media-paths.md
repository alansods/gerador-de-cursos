# Mídia quebrada no pacote SCORM exportado

## Sintoma

Reportado depois de testar um pacote num LMS real: a imagem do módulo 1 não aparecia.
Estranho, porque era uma URL externa (Wikimedia Commons), enquanto a imagem interativa do
módulo 4 — essa sim vinda de upload — aparecia normalmente.

O inspetor do LMS mostrava:

```html
<img src="/scorm-images/cmtnox6sj0000sf8w009auqn6/midia-1-…jpg" style="display: none;" />
```

## Causa

Duas falhas encaixadas, e a intuição sobre qual imagem deveria funcionar estava invertida.

### 1. O caminho reescrito não bate com o caminho no ZIP

`downloadAndUpdateImages` baixava a mídia e reescrevia a referência para
`/scorm-images/${cursoId}/${filename}`. Mas quem monta o pacote —
`generateSCORMFromPlayerDist` — grava os arquivos em `images/${filename}`.

Reproduzido com um export real antes de mexer em qualquer coisa:

|                            | valor                                                    |
| -------------------------- | -------------------------------------------------------- |
| Arquivo no ZIP             | `images/midia-1-aHR0cHM6Ly9jb21t.jpg`                    |
| Referência no `index.html` | `/scorm-images/teste-midia/midia-1-aHR0cHM6Ly9jb21t.jpg` |

Pasta diferente **e** caminho absoluto: a `/` inicial faz o LMS resolver a partir da raiz
do servidor, não da pasta do SCO. O `display: none` do print é o handler de erro do
componente escondendo a imagem quebrada.

O caminho `/scorm-images/…` fazia sentido no gerador antigo, que empacotava com
`addDirectoryToZip(publicImagesDir, 'scorm-images')`. Quando o pipeline passou a montar o
ZIP a partir do `player/dist`, a reescrita não acompanhou. O gerador antigo virou código
morto (`executeNextBuild`, `verifyBuildOutput` e `copyBuildFilesToZip` não são importados
por ninguém), mas a reescrita continuou apontando para a convenção dele.

### 2. Só dois tipos de bloco eram reescritos

`detectMediaUrls` é dirigido pelo catálogo e **baixa** mídia de seis tipos (`imagem`,
`flipcard`, `carrossel`, `audio`, `pdf`, `imagem-interativa`). Mas o `updateConteudo`
tratava só `imagem` e `flipcard`, escritos à mão.

Daí a inversão do sintoma:

- **Módulo 1** (`imagem`): era reescrito → caminho errado → **quebrou**.
- **Módulo 4** (`imagem-interativa`): não era reescrito → seguiu apontando para a URL
  remota do Blob → **funcionou, por acidente**, porque aquele LMS tem internet. Quebraria
  num LMS sem acesso externo, que é justamente o motivo de embutir mídia no pacote.

## Correção

**Caminho relativo, batendo com o ZIP:** `publicPath` passou de
`/scorm-images/${cursoId}/${filename}` para `images/${filename}`.

**Reescrita dirigida pelo catálogo:** `CATALOGO_BLOCOS` ganhou `reescreverMidias`, a
contraparte simétrica de `extrairMidias`, e o `updateConteudo` escrito à mão deu lugar a
`reescreverMidiasDoBloco()`. Bloco novo com mídia declara os dois no catálogo e passa a
ser baixado **e** reescrito sem tocar no `scorm-build-service`.

Um teste garante a simetria: todo tipo que declara `extrairMidias` precisa declarar
`reescreverMidias`. Era exatamente o que faltava para o `imagem-interativa`.

## Verificação

Export real gerado e o ZIP inspecionado, antes e depois:

|                         | Antes                         | Depois     |
| ----------------------- | ----------------------------- | ---------- |
| Referências reescritas  | 1 de 2                        | 2 de 2     |
| `src` no `index.html`   | `/scorm-images/teste-midia/…` | `images/…` |
| URL remota sobrevivente | `commons.wikimedia.org/…`     | nenhuma    |

Pacote extraído e servido por HTTP, renderizado headless: as duas `<img>` com
`src="images/midia-1-….jpg"`, `naturalWidth: 4288`, `display: block` — nenhuma resposta
HTTP de erro. Antes, o print do LMS mostrava `display: none`.

`pnpm test` → 277 testes (3 novos), 21 suítes, verde. `pnpm build` limpo.
`tsc --noEmit` → 0 erros de produção.

## Observação para depois

O `scorm-build-service.ts` tem ~450 linhas de gerador antigo que ninguém importa
(`executeNextBuild`, `verifyBuildOutput`, `copyBuildFilesToZip` e auxiliares). Foi o que
permitiu a divergência de convenção passar despercebida. Vale remover, em branch própria.
