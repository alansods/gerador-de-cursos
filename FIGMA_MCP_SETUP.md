# 🎨 Configuração do MCP do Figma

Este guia explica como conectar o Model Context Protocol (MCP) do Figma ao Cursor para integrar designs do Figma com o desenvolvimento.

## 📋 Pré-requisitos

1. **Conta no Figma** - Necessário para obter o token de acesso
2. **Cursor IDE** - Versão que suporta MCP (Model Context Protocol)
3. **Acesso ao arquivo do Figma** - URL do arquivo que deseja conectar

## 🔑 Passo 1: Obter o Figma Access Token

1. Acesse [https://www.figma.com/](https://www.figma.com/)
2. Faça login na sua conta
3. Vá em **Settings** (Configurações) → **Account** (Conta)
4. Role até a seção **Personal access tokens**
5. Clique em **Create new token**
6. Dê um nome descritivo (ex: "Cursor MCP Integration")
7. **Copie o token** - ele só aparece uma vez!

## ⚙️ Passo 2: Configurar no Cursor

**⚠️ IMPORTANTE**: O token no `.env.local` não é suficiente! Você precisa configurar o MCP nas preferências do Cursor.

### Opção A: Via Interface do Cursor (Recomendado)

1. Abra o Cursor
2. Vá em **Cursor Settings**:
   - macOS: `⌘ + ,` (Cmd + vírgula)
   - Windows/Linux: `Ctrl + ,`
3. Procure por **MCP** ou **Model Context Protocol** na barra de busca
4. Clique em **Add Server** ou **Configure Servers**
5. Adicione a configuração do Figma MCP com o token que você já tem:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-figma"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_fW_Dya6TPdgeLZoHBUFNEl0l8bAD-cydC0GdV1o9"
      }
    }
  }
}
```

6. **Salve as configurações** e **reinicie o Cursor** para aplicar as mudanças

### Opção B: Via Arquivo de Configuração Manual

O Cursor pode usar um arquivo de configuração MCP. Este arquivo geralmente fica em:
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/mcp.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/mcp.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\mcp.json`

Crie ou edite este arquivo com o conteúdo acima.

## 📝 Passo 3: Adicionar ao .env.local (Opcional)

Se você quiser manter o token em variáveis de ambiente do projeto:

```bash
# Adicione ao .env.local
FIGMA_ACCESS_TOKEN="seu-token-aqui"
```

**⚠️ Importante**: O arquivo `.env.local` já está no `.gitignore`, então o token não será commitado.

## 🧪 Passo 4: Verificar se Já Está Configurado

O MCP do Figma pode já estar configurado no seu Cursor. Para verificar:

1. **Verifique se as ferramentas MCP estão disponíveis**: Se você conseguir usar ferramentas como `mcp_Framelink_Figma_MCP_get_figma_data`, o MCP já está configurado
2. **Teste básico**: Tente pedir ao Cursor para acessar um arquivo do Figma

## 🧪 Passo 5: Testar a Conexão

1. Abra o Cursor
2. Tente usar o MCP do Figma mencionando um arquivo do Figma
   - Exemplo: "Acesse o design do Figma em https://www.figma.com/file/abc123/MeuDesign"
3. O Cursor deve ser capaz de acessar e ler os designs do Figma

### Como Obter o File Key do Figma

A URL do Figma geralmente tem o formato:
```
https://www.figma.com/file/FILE_KEY/Nome-do-Arquivo
```

O `FILE_KEY` é a parte que você precisa fornecer. Por exemplo:
- URL: `https://www.figma.com/file/abc123xyz/MeuDesign`
- File Key: `abc123xyz`

## 📚 Como Usar

Após configurado, você pode:

1. **Mencionar arquivos do Figma**: Forneça a URL do arquivo do Figma
   - Exemplo: `https://www.figma.com/file/abc123/MeuDesign`
   
2. **Extrair componentes**: O Cursor pode ler componentes do Figma e gerar código React/Next.js baseado neles

3. **Baixar assets**: O MCP pode baixar imagens e ícones do Figma automaticamente

## 🔍 Exemplo de Uso

```typescript
// Você pode pedir ao Cursor:
// "Use o design do Figma em https://www.figma.com/file/abc123/MeuDesign 
//  para criar os componentes React"
```

O Cursor usará o MCP do Figma para:
- Ler o layout do design
- Extrair informações de componentes
- Gerar código baseado no design
- Baixar imagens e assets necessários

## 🆘 Troubleshooting

### Erro: "Figma MCP server not found"
- Verifique se o servidor MCP está instalado: `npx -y @modelcontextprotocol/server-figma`
- Certifique-se de que a configuração está correta nas preferências do Cursor

### Erro: "Invalid access token"
- Verifique se o token está correto
- Certifique-se de que o token não expirou
- Gere um novo token no Figma se necessário

### Erro: "Cannot access Figma file"
- Verifique se você tem permissão para acessar o arquivo do Figma
- Certifique-se de que a URL do arquivo está correta
- O arquivo deve ser público ou você deve ter acesso através da sua conta

## 📖 Documentação Adicional

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor MCP Documentation](https://cursor.sh/docs/mcp)

## ⚠️ Notas Importantes

1. **Segurança**: Nunca commite tokens de acesso no código
2. **Limites de API**: O Figma tem limites de rate limiting na API
3. **Permissões**: Certifique-se de ter permissões adequadas nos arquivos do Figma
4. **Privacidade**: Arquivos privados do Figma requerem tokens com permissões adequadas

