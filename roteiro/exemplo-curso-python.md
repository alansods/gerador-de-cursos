# METADADOS DO CURSO
**Título:** Python para Iniciantes
**Categoria:** Programação
**Carga Horária:** 30 horas
**Modalidade:** Online
**Instrutor:** Maria Santos

## DESCRIÇÃO DO CURSO
Aprenda Python do zero, uma das linguagens de programação mais populares e versáteis do mundo. Este curso cobre desde conceitos básicos até programação orientada a objetos, preparando você para criar seus próprios projetos e avançar para áreas como Data Science, Web Development e Automação.

---

# UNIDADE 1: Introdução ao Python

## Descrição da Unidade
Nesta unidade, você conhecerá a linguagem Python, aprenderá a instalar o ambiente de desenvolvimento e escreverá seus primeiros programas. Entenderá por que Python é uma excelente escolha para iniciantes e profissionais.

## Por que aprender Python?

Python é uma linguagem de programação de alto nível, interpretada e de propósito geral. Criada por Guido van Rossum em 1991, Python se destaca pela sua sintaxe clara e legível, tornando-a ideal para iniciantes.

A linguagem é utilizada por empresas como Google, Netflix, Instagram, Spotify e NASA, demonstrando sua robustez e versatilidade. Python é aplicada em desenvolvimento web, análise de dados, inteligência artificial, automação, computação científica e muito mais.

### Características Principais

Python possui características que a tornam única:

- **Sintaxe Simples**: Código limpo e fácil de ler, similar ao inglês
- **Multiplataforma**: Funciona em Windows, Mac, Linux e outros sistemas
- **Interpretada**: Não precisa compilar, execute diretamente
- **Tipagem Dinâmica**: Não precisa declarar tipos de variáveis
- **Grande Comunidade**: Milhões de desenvolvedores e bibliotecas gratuitas
- **Versátil**: Serve para web, dados, IA, automação, jogos e mais

### Instalando Python

Para começar, você precisa instalar Python no seu computador:

**Windows:**
1. Acesse python.org/downloads
2. Baixe o instalador mais recente (Python 3.11+)
3. Execute e marque "Add Python to PATH"
4. Clique em "Install Now"

**Mac/Linux:**
Python geralmente já vem instalado. Abra o terminal e digite:
```bash
python3 --version
```

Se não estiver instalado, use `brew install python3` (Mac) ou o gerenciador de pacotes da sua distribuição Linux.

### Primeiro Programa

Abra um editor de texto ou IDE (recomendamos VS Code ou PyCharm) e crie um arquivo `ola.py`:

```python
print("Olá, Mundo!")
print("Bem-vindo ao Python!")
```

Execute no terminal:
```bash
python ola.py
```

Parabéns! Você acabou de executar seu primeiro programa Python!

---

# UNIDADE 2: Variáveis e Tipos de Dados

## Descrição da Unidade
Aprenda a armazenar e manipular dados em Python. Entenda os tipos de dados fundamentais (strings, números, booleanos) e como trabalhar com cada um deles.

## Variáveis em Python

Variáveis são como caixas que armazenam valores. Em Python, você não precisa declarar o tipo da variável, ela é inferida automaticamente:

```python
nome = "Maria"
idade = 25
altura = 1.65
estudante = True
```

Python aceita nomes descritivos para variáveis. Use letras minúsculas e underscores: `nome_completo`, `idade_usuario`.

### Tipos de Dados Básicos

Python possui vários tipos de dados fundamentais:

**Strings (texto):**
```python
mensagem = "Olá, Python!"
nome = 'João'  # Aspas simples ou duplas
texto_longo = """Este é um
texto com várias
linhas"""
```

**Números inteiros:**
```python
idade = 30
ano = 2024
negativos = -10
```

**Números decimais (float):**
```python
preco = 19.99
pi = 3.14159
temperatura = -5.5
```

**Booleanos (True/False):**
```python
aprovado = True
maior_idade = False
```

### Operações com Strings

Strings podem ser manipuladas de várias formas:

```python
nome = "Python"
sobrenome = "Programming"

# Concatenação
nome_completo = nome + " " + sobrenome

# Repetição
linha = "=" * 20

# Métodos úteis
print(nome.upper())      # PYTHON
print(nome.lower())      # python
print(nome.capitalize()) # Python
print(len(nome))         # 6
```

### Operações Matemáticas

Python suporta todas as operações matemáticas básicas:

```python
soma = 10 + 5        # 15
subtracao = 10 - 5   # 5
multiplicacao = 10 * 5  # 50
divisao = 10 / 3     # 3.333...
divisao_inteira = 10 // 3  # 3
resto = 10 % 3       # 1
potencia = 2 ** 3    # 8
```

---

# UNIDADE 3: Estruturas de Controle

## Descrição da Unidade
Aprenda a controlar o fluxo de execução do seu programa usando condicionais (if/else) e loops (for/while). Estas estruturas são fundamentais para criar programas dinâmicos.

## Condicionais (if/elif/else)

Condicionais permitem executar código baseado em condições:

```python
idade = 18

if idade >= 18:
    print("Você é maior de idade")
else:
    print("Você é menor de idade")
```

Para múltiplas condições, use `elif`:

```python
nota = 7.5

if nota >= 9:
    print("Excelente!")
elif nota >= 7:
    print("Aprovado")
elif nota >= 5:
    print("Recuperação")
else:
    print("Reprovado")
```

### Operadores de Comparação

Python oferece vários operadores para comparar valores:

- `==` igual a
- `!=` diferente de
- `>` maior que
- `<` menor que
- `>=` maior ou igual
- `<=` menor ou igual

### Operadores Lógicos

Combine múltiplas condições:

```python
idade = 20
tem_carteira = True

if idade >= 18 and tem_carteira:
    print("Pode dirigir")

if idade < 18 or not tem_carteira:
    print("Não pode dirigir")
```

## Loops (Repetições)

Loops permitem executar código repetidamente.

### Loop For

Use `for` quando souber quantas vezes repetir:

```python
# Iterar sobre uma sequência
for i in range(5):
    print(f"Contagem: {i}")

# Iterar sobre uma lista
frutas = ["maçã", "banana", "laranja"]
for fruta in frutas:
    print(f"Eu gosto de {fruta}")
```

### Loop While

Use `while` quando não souber quantas vezes repetir:

```python
contador = 0
while contador < 5:
    print(f"Contador: {contador}")
    contador += 1

# Loop infinito com break
while True:
    resposta = input("Digite 'sair' para encerrar: ")
    if resposta == "sair":
        break
```

---

# UNIDADE 4: Estruturas de Dados

## Descrição da Unidade
Aprenda a trabalhar com coleções de dados usando listas, tuplas, dicionários e conjuntos. Estas estruturas são essenciais para organizar informações em seus programas.

## Listas

Listas armazenam múltiplos valores em uma única variável:

```python
numeros = [1, 2, 3, 4, 5]
nomes = ["Ana", "João", "Maria"]
misto = [1, "texto", 3.14, True]

# Acessar elementos (índice começa em 0)
print(nomes[0])  # Ana
print(nomes[-1]) # Maria (último)

# Modificar
nomes[1] = "Pedro"

# Adicionar
nomes.append("Carlos")
nomes.insert(0, "Beatriz")

# Remover
nomes.remove("Ana")
ultimo = nomes.pop()
```

### Operações com Listas

Listas possuem métodos úteis:

```python
numeros = [3, 1, 4, 1, 5, 9, 2, 6]

# Ordenar
numeros.sort()

# Inverter
numeros.reverse()

# Tamanho
tamanho = len(numeros)

# Verificar existência
existe = 5 in numeros

# Fatiar (slicing)
primeiros_tres = numeros[0:3]
ultimos_dois = numeros[-2:]
```

## Dicionários

Dicionários armazenam pares chave-valor:

```python
pessoa = {
    "nome": "João",
    "idade": 30,
    "cidade": "São Paulo"
}

# Acessar
print(pessoa["nome"])
print(pessoa.get("idade"))

# Modificar
pessoa["idade"] = 31

# Adicionar
pessoa["profissao"] = "Desenvolvedor"

# Remover
del pessoa["cidade"]

# Iterar
for chave, valor in pessoa.items():
    print(f"{chave}: {valor}")
```

---

# UNIDADE 5: Funções

## Descrição da Unidade
Aprenda a criar funções para organizar e reutilizar código. Entenda parâmetros, retornos, escopos e boas práticas de programação modular.

## Criando Funções

Funções são blocos de código reutilizáveis:

```python
def saudar():
    print("Olá!")

# Chamar a função
saudar()
```

### Funções com Parâmetros

Funções podem receber dados de entrada:

```python
def saudar_pessoa(nome):
    print(f"Olá, {nome}!")

saudar_pessoa("Maria")
saudar_pessoa("João")

# Múltiplos parâmetros
def calcular_media(nota1, nota2, nota3):
    media = (nota1 + nota2 + nota3) / 3
    return media

resultado = calcular_media(8, 7.5, 9)
print(f"Média: {resultado}")
```

### Parâmetros Padrão

Defina valores padrão para parâmetros:

```python
def criar_perfil(nome, idade=18, cidade="São Paulo"):
    return f"{nome}, {idade} anos, {cidade}"

perfil1 = criar_perfil("Ana")
perfil2 = criar_perfil("João", 25)
perfil3 = criar_perfil("Maria", 30, "Rio de Janeiro")
```

### Retorno de Valores

Funções podem retornar valores:

```python
def calcular_area_retangulo(base, altura):
    area = base * altura
    return area

def verificar_par(numero):
    return numero % 2 == 0

# Múltiplos retornos
def dividir(a, b):
    if b == 0:
        return None, "Erro: divisão por zero"
    return a / b, "Sucesso"
```

---

# UNIDADE 6: Programação Orientada a Objetos

## Descrição da Unidade
Introdução aos conceitos de Programação Orientada a Objetos (POO) em Python. Aprenda a criar classes, objetos, atributos e métodos para organizar código de forma mais eficiente.

## Classes e Objetos

Classes são moldes para criar objetos:

```python
class Pessoa:
    def __init__(self, nome, idade):
        self.nome = nome
        self.idade = idade
    
    def apresentar(self):
        return f"Olá, meu nome é {self.nome} e tenho {self.idade} anos"

# Criar objetos
pessoa1 = Pessoa("João", 30)
pessoa2 = Pessoa("Maria", 25)

print(pessoa1.apresentar())
print(pessoa2.nome)
```

### Atributos e Métodos

Classes podem ter dados (atributos) e comportamentos (métodos):

```python
class ContaBancaria:
    def __init__(self, titular, saldo=0):
        self.titular = titular
        self.saldo = saldo
    
    def depositar(self, valor):
        self.saldo += valor
        return f"Depósito de R${valor:.2f} realizado"
    
    def sacar(self, valor):
        if valor > self.saldo:
            return "Saldo insuficiente"
        self.saldo -= valor
        return f"Saque de R${valor:.2f} realizado"
    
    def ver_saldo(self):
        return f"Saldo atual: R${self.saldo:.2f}"

conta = ContaBancaria("João", 1000)
print(conta.depositar(500))
print(conta.sacar(200))
print(conta.ver_saldo())
```

### Herança

Classes podem herdar características de outras:

```python
class Animal:
    def __init__(self, nome):
        self.nome = nome
    
    def fazer_som(self):
        pass

class Cachorro(Animal):
    def fazer_som(self):
        return "Au au!"

class Gato(Animal):
    def fazer_som(self):
        return "Miau!"

rex = Cachorro("Rex")
felix = Gato("Felix")

print(f"{rex.nome} faz: {rex.fazer_som()}")
print(f"{felix.nome} faz: {felix.fazer_som()}")
```

---

# RECURSOS COMPLEMENTARES

## Links Úteis
- Documentação oficial Python: https://docs.python.org/pt-br/3/
- Python Brasil: https://python.org.br/
- Real Python (tutoriais): https://realpython.com/
- W3Schools Python: https://www.w3schools.com/python/

## Leituras Recomendadas
- "Python Fluente" por Luciano Ramalho
- "Automatize Tarefas Maçantes com Python" por Al Sweigart
- "Python para Análise de Dados" por Wes McKinney

## Ferramentas e Materiais
- VS Code com extensão Python
- PyCharm Community Edition
- Jupyter Notebook para experimentação
- Python Tutor para visualizar execução
- LeetCode e HackerRank para praticar

