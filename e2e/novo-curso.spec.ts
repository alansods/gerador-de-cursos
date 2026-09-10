/**
 * Testes E2E - Novo Curso (wizard em 4 etapas)
 *
 * Exige ambiente completo: servidor de dev, banco acessível e as credenciais
 * de E2E_EMAIL / E2E_SENHA (padrão: conteudista do seed).
 */

import { test, expect, type Page } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'alan.conteudista@senai.br'
const SENHA = process.env.E2E_SENHA ?? '123456'
const EMAIL_CONVIDADO = process.env.E2E_EMAIL_CONVIDADO ?? 'convidado@senai.br'
const SENHA_CONVIDADO = process.env.E2E_SENHA_CONVIDADO ?? 'convidado'
const EMAIL_REVISOR = process.env.E2E_EMAIL_REVISOR
const SENHA_REVISOR = process.env.E2E_SENHA_REVISOR

async function entrar(page: Page, email: string, senha: string) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  // exato: a tela também tem "Entrar como Convidado"
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL(/\/(home|cursos)/)
}

async function preencherInformacoes(page: Page, titulo: string) {
  await page.getByLabel('Título do curso').fill(titulo)
  await page.getByRole('radio', { name: 'Tecnologia' }).click()
  await page
    .getByLabel('Descrição')
    .fill('Ao final o aluno identifica componentes e configura um CLP básico com segurança.')
  await page.getByLabel('Carga horária').fill('40')
}

test.describe('E2E - Novo Curso', () => {
  test('percorre as quatro etapas e cria um curso manual', async ({ page }) => {
    await entrar(page, EMAIL, SENHA)
    await page.goto('/cursos/novo')

    await expect(page.getByRole('heading', { name: 'Como você quer começar?' })).toBeVisible()
    await page.getByRole('radio', { name: /Criação manual/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page.getByRole('heading', { name: 'Informações do curso' })).toBeVisible()
    const titulo = `Curso E2E ${Date.now()}`
    await preencherInformacoes(page, titulo)
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page.getByRole('heading', { name: 'Escolha o layout do curso' })).toBeVisible()
    await page.getByRole('radio', { name: /Sidebar/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page.getByRole('heading', { name: 'Revise antes de criar' })).toBeVisible()
    await expect(page.getByText(titulo)).toBeVisible()
    await expect(page.getByText(/Tecnologia · 40 horas · Online/)).toBeVisible()

    await page.getByRole('button', { name: /Criar curso/ }).click()

    // O wizard não navega mais sozinho: termina numa tela de sucesso com
    // "Abrir no editor" e "Criar outro curso".
    await expect(page.getByRole('heading', { name: 'Curso criado' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Abrir no editor' })).toBeVisible()

    await page.goto('/cursos')
    await expect(page.getByText(titulo)).toBeVisible({ timeout: 15000 })
  })

  test('não avança com campos inválidos e destaca o que falta', async ({ page }) => {
    await entrar(page, EMAIL, SENHA)
    await page.goto('/cursos/novo')

    await page.getByRole('button', { name: /Continuar/ }).click()
    await expect(page.getByText('Selecione um método para continuar')).toBeVisible()

    await page.getByRole('radio', { name: /Criação manual/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await expect(page.getByText('Corrija os campos destacados para continuar')).toBeVisible()
    await expect(page.getByText('Informe o título do curso')).toBeVisible()
    await expect(page.getByLabel('Título do curso')).toBeFocused()

    await page.getByLabel('Título do curso').fill('CLP')
    await page.getByLabel('Título do curso').blur()
    await expect(page.getByText('O título deve ter pelo menos 5 caracteres')).toBeVisible()

    await page.getByLabel('Carga horária').fill('40 horas')
    await page.getByLabel('Carga horária').blur()
    await expect(page.getByText('Use apenas números, sem letras ou símbolos')).toBeVisible()
  })

  test('aceita o documento de exemplo e segue para a geração', async ({ page }) => {
    await entrar(page, EMAIL, SENHA)

    const resposta = await page.request.get('/api/sample-document')
    expect(resposta.ok()).toBeTruthy()
    const exemplo = await resposta.body()

    await page.goto('/cursos/novo')
    await page.getByRole('radio', { name: /Gerar por IA/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    await page.setInputFiles('input[type="file"]', {
      name: 'exemplo-curso-com-marcadores.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: exemplo,
    })

    await expect(page.getByText(/pronto para gerar/)).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Marcadores encontrados/)).toHaveCount(0)

    await page.getByRole('button', { name: /Continuar/ }).click()
    await expect(page.getByRole('heading', { name: 'Escolha o layout do curso' })).toBeVisible()
  })

  test('convidado consegue abrir o wizard e criar curso', async ({ page }) => {
    await entrar(page, EMAIL_CONVIDADO, SENHA_CONVIDADO)
    await page.goto('/cursos/novo')

    await expect(page).toHaveURL(/\/cursos\/novo/)
    await expect(page.getByRole('heading', { name: 'Como você quer começar?' })).toBeVisible()

    await page.getByRole('radio', { name: /Criação manual/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    const titulo = `Curso Convidado ${Date.now()}`
    await preencherInformacoes(page, titulo)
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()
    await page.getByRole('button', { name: /Criar curso/ }).click()

    await expect(page.getByRole('heading', { name: 'Curso criado' })).toBeVisible({
      timeout: 15000,
    })
  })

  test('bloqueia o revisor, que não cria cursos', async ({ page }) => {
    test.skip(!EMAIL_REVISOR, 'defina E2E_EMAIL_REVISOR/E2E_SENHA_REVISOR para rodar')

    await entrar(page, EMAIL_REVISOR as string, SENHA_REVISOR as string)
    await page.goto('/cursos/novo')

    await expect(page).not.toHaveURL(/\/cursos\/novo/)
  })

  test('mantém o rascunho ao recarregar a página', async ({ page }) => {
    await entrar(page, EMAIL, SENHA)
    await page.goto('/cursos/novo')

    await page.getByRole('radio', { name: /Criação manual/ }).click()
    await page.getByRole('button', { name: /Continuar/ }).click()

    const titulo = `Rascunho ${Date.now()}`
    await page.getByLabel('Título do curso').fill(titulo)

    page.on('dialog', (dialog) => dialog.accept())
    await page.reload()

    await expect(page.getByLabel('Título do curso')).toHaveValue(titulo)
  })
})
