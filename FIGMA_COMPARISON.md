# 📊 Comparação: Design Figma vs Implementação Atual

## ✅ O que já está implementado
- Sidebar com navegação
- Grid de cards de cursos
- Filtros de busca, categoria e modalidade
- Paginação
- Botões de ação (Preview, Editar, Exportar)

## ❌ Diferenças e Elementos Faltantes

### 1. **Layout Geral**
**Figma:**
- Sidebar fixa à esquerda (256px) + Main Content à direita
- Background: `#F5F7FA` (cinza claro)
- Sidebar: `#FFFFFF` com borda direita `#E2E8F0`

**Atual:**
- Página de cursos não usa a Sidebar integrada
- Layout diferente do Figma

**Ação necessária:** Integrar Sidebar na página de cursos

---

### 2. **Header da Página**
**Figma:**
- Título: "Gerador de Cursos" (24px, fontWeight 500, cor #1A202C)
- Subtítulo: "Crie e gerencie seus cursos online" (16px, fontWeight 400, cor #64748B)
- Botão "Novo Curso": Background #0047BB, texto branco, padding 36px altura
- Layout: Título/subtítulo à esquerda, botão à direita com espaço entre

**Atual:**
- Header existe mas layout e espaçamentos podem estar diferentes

**Ação necessária:** Ajustar espaçamentos e tipografia do header

---

### 3. **Filtros e Busca**
**Figma:**
- Select "Todas Categorias": 180px largura, 36px altura, border transparente, background branco
- Select "Todas Modalidades": 180px largura, 36px altura
- Input de busca: 400px largura, ícone de lupa dentro à esquerda (padding-left: 40px)
- Placeholder: "Buscar cursos..." (14px, cor #64748B)
- Layout: Filtros em linha horizontal com gaps

**Atual:**
- Filtros existem mas podem ter dimensões diferentes
- Busca pode ter estilos diferentes

**Ação necessária:** Ajustar dimensões e estilos dos filtros

---

### 4. **Seção "Seus Cursos"**
**Figma:**
- Título: "Seus Cursos" (18px, fontWeight 500)
- Contador: "10 cursos encontrados" (14px, fontWeight 400, cor #64748B)
- Layout: Título e contador na mesma linha, espaçados

**Atual:**
- Contador existe mas pode estar em layout diferente

**Ação necessária:** Verificar layout do contador

---

### 5. **Cards de Curso**
**Figma:**
- **Badge de categoria:**
  - Background: #E3F2FD (azul claro)
  - Texto: #0047BB (azul)
  - FontSize: 12px, fontWeight: 500
  - Padding: 2px 8px
  - BorderRadius: 6px

- **Título do curso:**
  - FontSize: 16px, fontWeight: 400
  - Cor: #1A202C
  - LineHeight: 1.5em

- **Descrição:**
  - FontSize: 14px, fontWeight: 400
  - Cor: #64748B
  - Truncada com "..."

- **Informações (horas, unidades, modalidade):**
  - Layout horizontal com divisores (#E2E8F0)
  - Ícones + texto
  - FontSize: 14px
  - Cor texto: #1A202C

- **Botões de ação:**
  - **Preview**: Background branco, border #E2E8F0, texto #1A202C
  - **Editar**: Background branco, border #E2E8F0, texto #1A202C
  - **Exportar**: Background #F15A29 (laranja), texto branco, sem border
  - **Menu (três pontos)**: Background branco, border #E2E8F0, ícone vermelho (#EF4444)
  - Todos com 32px altura, borderRadius 6px

**Atual:**
- Cards existem mas podem ter:
  - Cores diferentes no badge
  - Botão "Exportar" pode não ter cor laranja (#F15A29)
  - Botão menu (três pontos) pode não existir
  - Espaçamentos internos podem estar diferentes

**Ação necessária:**
- Ajustar cores do badge (#E3F2FD background, #0047BB texto)
- Cor laranja no botão Exportar (#F15A29)
- Adicionar botão menu (três pontos) se não existir
- Verificar espaçamentos e padding interno dos cards

---

### 6. **Grid de Cards**
**Figma:**
- Grid de 3 colunas
- Cards com largura: 382px (com padding 24px)
- Gap entre cards
- BorderRadius: 12px nos cards
- Border: 1px #E2E8F0
- Background: #FFFFFF

**Atual:**
- Grid existe mas pode ter gaps/dimensões diferentes

**Ação necessária:** Ajustar grid para 3 colunas com dimensões corretas

---

### 7. **Paginação**
**Figma:**
- Botão "Anterior": Opacity 0.5 quando desabilitado
- Números de página: 36px x 36px quando ativo
- Ativo: Background #F5F7FA, border #E2E8F0, texto #1A202C
- Inativo: Sem background, texto #1A202C
- Botão "Próximo": Normal quando habilitado

**Atual:**
- Paginação existe mas estilos podem estar diferentes

**Ação necessária:** Ajustar estilos da paginação

---

### 8. **Sidebar (quando integrada)**
**Figma:**
- Logo/EduPlatform: 40x40px, background #0047BB, borderRadius 8px
- Texto "EduPlatform": 20px, fontWeight 500
- Texto "Admin": 14px, fontWeight 400, cor #64748B
- Item ativo (Cursos): Background #E3F2FD, texto #0047BB
- Item inativo: Sem background, texto #1A202C
- Botões Modo Escuro/Fixado: Separados por border top
- Perfil usuário: Avatar circular com inicial, nome e email
- Botão Sair: Ghost, com ícone

**Atual:**
- Sidebar existe mas pode ter estilos diferentes quando ativo

**Ação necessária:** Verificar cores e estados ativos da sidebar

---

## 🎨 Cores do Figma (para referência)
- **Primary Blue**: #0047BB
- **Light Blue**: #E3F2FD (badge background)
- **Orange**: #F15A29 (botão Exportar)
- **Text Dark**: #1A202C
- **Text Gray**: #64748B
- **Background**: #F5F7FA
- **Card Background**: #FFFFFF
- **Border**: #E2E8F0
- **Red**: #EF4444 (ícone menu)

---

## 📝 Resumo de Ações Prioritárias

1. **Integrar Sidebar** na página de cursos
2. **Ajustar cores do badge** de categoria (#E3F2FD background)
3. **Cor laranja no botão Exportar** (#F15A29)
4. **Adicionar botão menu** (três pontos) nos cards
5. **Ajustar espaçamentos e tipografia** do header
6. **Verificar dimensões** dos filtros e inputs
7. **Ajustar grid** para 3 colunas com medidas corretas
8. **Estilizar paginação** conforme Figma

