'use client'

// Esta página não deve ser exportada estaticamente (usa context e API)
export const dynamic = 'error';

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { PageTransition } from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Save, Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react'
import { toast } from 'sonner'
import { TokenMeter, type TokenUsage } from '@/components/TokenMeter'

export default function NovoCursoPage() {
  const router = useRouter()
  const { criarCurso } = useGeradorCurso()

  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    cargaHoraria: '',
    modalidade: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Estados para a geração por IA
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<'idle' | 'extracting' | 'generating' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [validationMessage, setValidationMessage] = useState<{
    type: 'error' | 'warning' | 'success' | 'info'
    message: string
  } | null>(null)
  const [tokenInfo, setTokenInfo] = useState<{
    extractedChars: number
    totalDocChars: number
    estimatedPromptTokens: number
  } | null>(null)
  const [actualTokenUsage, setActualTokenUsage] = useState<TokenUsage | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!formData.titulo.trim()) next.titulo = 'Título é obrigatório'
    if (!formData.descricao.trim()) next.descricao = 'Descrição é obrigatória'
    if (!formData.cargaHoraria.trim()) next.cargaHoraria = 'Carga horária é obrigatória'
    if (!formData.modalidade.trim()) next.modalidade = 'Modalidade é obrigatória'
    if (!formData.categoria.trim()) next.categoria = 'Categoria é obrigatória'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const idealSize = 5 * 1024 * 1024 // 5MB

    if (file.size > maxSize) {
      setValidationMessage({
        type: 'error',
        message: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). O tamanho máximo é 10MB. Por favor, reduza o tamanho do documento.`
      })
      return false
    }

    if (file.size > idealSize) {
      setValidationMessage({
        type: 'warning',
        message: `Arquivo grande (${(file.size / 1024 / 1024).toFixed(2)}MB). O processamento pode demorar até 60 segundos. Recomendamos arquivos menores que 5MB para melhor performance.`
      })
    } else {
      setValidationMessage({
        type: 'success',
        message: `Arquivo válido (${(file.size / 1024 / 1024).toFixed(2)}MB). Pronto para processar!`
      })
    }

    return true
  }

  const extractAndEstimate = async (file: File) => {
    setIsExtracting(true)
    setTokenInfo(null)
    setExtractedText(null)
    setActualTokenUsage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/extract-document', { method: 'POST', body: formData })

      if (!res.ok) {
        const ct = res.headers.get('content-type')
        const msg = ct?.includes('application/json')
          ? (await res.json()).message ?? 'Erro ao extrair texto'
          : `Erro ${res.status} ao extrair texto`
        throw new Error(msg)
      }

      const { text } = await res.json()
      const extractedChars = Math.min(text.length, 10000)
      const estimatedPromptTokens = Math.ceil((extractedChars + 500) / 3.5)

      setExtractedText(text)
      setTokenInfo({ extractedChars, totalDocChars: text.length, estimatedPromptTokens })
    } catch (error) {
      setValidationMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao analisar documento'
      })
      setSelectedFile(null)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo - APENAS DOCX/DOC
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ]
    if (!allowedTypes.includes(file.type)) {
      setValidationMessage({
        type: 'error',
        message: 'Tipo de arquivo não suportado. Use apenas documentos Word (.doc ou .docx).'
      })
      return
    }

    // Validar tamanho
    if (validateFileSize(file)) {
      setSelectedFile(file)
      extractAndEstimate(file)
    } else {
      setSelectedFile(null)
    }
  }

  const handleDownloadExample = async () => {
    try {
      // Buscar o arquivo de exemplo em DOCX
      const response = await fetch('/roteiro/exemplo-curso.docx')
      if (!response.ok) throw new Error('Erro ao buscar exemplo')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'exemplo-curso.docx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar exemplo:', error)
      setValidationMessage({
        type: 'error',
        message: 'Erro ao baixar arquivo de exemplo. Tente novamente.'
      })
    }
  }

  const handleGenerateWithAI = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setActualTokenUsage(null)

    let text = extractedText

    // Se o texto ainda não foi extraído (ex: extração falhou ou não terminou), extrai agora
    if (!text) {
      setProcessingStep('extracting')
      setProgress(10)

      try {
        const fd = new FormData()
        fd.append('file', selectedFile)
        setProgress(20)

        const extractResponse = await fetch('/api/extract-document', { method: 'POST', body: fd })

        if (!extractResponse.ok) {
          const contentType = extractResponse.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const err = await extractResponse.json()
            throw new Error(err.message || err.error || 'Erro ao extrair texto do documento')
          }
          throw new Error(`Erro ao extrair texto (${extractResponse.status})`)
        }

        const data = await extractResponse.json()
        text = data.text
        setProgress(40)

        const extractedChars = Math.min(text!.length, 10000)
        const estimatedPromptTokens = Math.ceil((extractedChars + 500) / 3.5)
        setTokenInfo({ extractedChars, totalDocChars: text!.length, estimatedPromptTokens })
      } catch (error) {
        setValidationMessage({ type: 'error', message: error instanceof Error ? error.message : 'Erro ao extrair texto' })
        setIsProcessing(false)
        setProcessingStep('idle')
        setProgress(0)
        return
      }
    } else {
      setProgress(40)
    }

    // Gerar curso com IA
    setProcessingStep('generating')
    setProgress(50)

    try {
      const generateResponse = await fetch('/api/generate-course-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!generateResponse.ok) {
        // Verificar se a resposta é JSON antes de parsear
        const contentType = generateResponse.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await generateResponse.json()
          throw new Error(error.message || error.error || 'Erro ao gerar curso')
        } else {
          const text = await generateResponse.text()
          console.error('Erro não-JSON da API:', text.substring(0, 200))
          throw new Error(`Erro ao gerar curso (${generateResponse.status}): ${text.substring(0, 100)}`)
        }
      }

      // Verificar content-type antes de parsear JSON
      const generateContentType = generateResponse.headers.get('content-type')
      if (!generateContentType || !generateContentType.includes('application/json')) {
        const text = await generateResponse.text()
        console.error('Resposta não-JSON da API generate-course-from-text:', text.substring(0, 200))
        throw new Error('Resposta inválida da API de geração')
      }

      const { course, tokenUsage } = await generateResponse.json()
      if (tokenUsage) setActualTokenUsage(tokenUsage)
      setProgress(80)

      // Passo 3: Criar curso no banco (remover instrutor se existir)
      const cursoParaSalvar = { ...course }
      // Remover instrutor se existir (campo foi removido do schema)
      if ('instrutor' in cursoParaSalvar) {
        const curso = cursoParaSalvar as { instrutor?: unknown; [key: string]: unknown }
        delete curso.instrutor
      }
      await criarCurso(cursoParaSalvar)
      setProgress(100)
      setProcessingStep('done')

      // Toast de sucesso
      toast.success('Curso gerado')

      // Aguardar 1.5s para o usuário ver o sucesso
      setTimeout(() => {
        router.push('/cursos')
      }, 1500)
    } catch (error) {
      console.error('Erro ao gerar curso:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar documento'
      
      setValidationMessage({
        type: 'error',
        message: errorMessage
      })
      
      toast.error('Erro ao gerar')
      
      setIsProcessing(false)
      setProcessingStep('idle')
      setProgress(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await criarCurso({ ...formData, unidades: [] })
      toast.success('Curso criado')
      router.push('/cursos')
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      toast.error('Erro ao criar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <button
                  onClick={() => router.back()}
                  className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-full w-full" />
                </button>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Novo Curso</h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">Crie um novo curso manualmente ou gere automaticamente usando IA</p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="pt-6">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Criação Manual
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar por IA
                </TabsTrigger>
              </TabsList>

              {/* Tab Manual */}
              <TabsContent value="manual">
                <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="titulo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Título do Curso *</label>
                  <Input id="titulo" value={formData.titulo} onChange={(e) => setField('titulo', e.target.value)} placeholder="Ex: Introdução ao React" className={errors.titulo ? 'border-red-500' : ''} />
                  {errors.titulo && <p className="text-sm text-red-600 dark:text-red-400">{errors.titulo}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="categoria" className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria *</label>
                  <Input id="categoria" value={formData.categoria} onChange={(e) => setField('categoria', e.target.value)} placeholder="Ex: Programação, Design, Marketing" className={errors.categoria ? 'border-red-500' : ''} />
                  {errors.categoria && <p className="text-sm text-red-600 dark:text-red-400">{errors.categoria}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="descricao" className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição *</label>
                <textarea id="descricao" value={formData.descricao} onChange={(e) => setField('descricao', e.target.value)} placeholder="Descreva o que os alunos aprenderão neste curso..." rows={5} className={`w-full px-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.descricao ? 'border-red-500' : ''}`} />
                {errors.descricao && <p className="text-sm text-red-600 dark:text-red-400">{errors.descricao}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="cargaHoraria" className="text-sm font-medium text-gray-700 dark:text-gray-300">Carga Horária *</label>
                  <Input id="cargaHoraria" value={formData.cargaHoraria} onChange={(e) => setField('cargaHoraria', e.target.value)} placeholder="Ex: 40 horas" className={errors.cargaHoraria ? 'border-red-500' : ''} />
                  {errors.cargaHoraria && <p className="text-sm text-red-600 dark:text-red-400">{errors.cargaHoraria}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="modalidade" className="text-sm font-medium text-gray-700 dark:text-gray-300">Modalidade *</label>
                  <Input id="modalidade" value={formData.modalidade} onChange={(e) => setField('modalidade', e.target.value)} placeholder="Ex: Online, Presencial, Híbrido" className={errors.modalidade ? 'border-red-500' : ''} />
                  {errors.modalidade && <p className="text-sm text-red-600 dark:text-red-400">{errors.modalidade}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2" disabled={isLoading}>
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Criando...' : 'Criar Curso'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Tab IA */}
          <TabsContent value="ai">
            <div className="space-y-6">
              {/* Informações */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200">Como funciona a geração por IA?</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Envie um documento Word (.docx ou .doc) estruturado com o conteúdo do curso.
                        A IA irá processar o documento e criar automaticamente o curso com unidades e conteúdo organizados.
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        💡 Use Google Docs ou Microsoft Word para criar seu documento!
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadExample}
                      className="gap-2 bg-white hover:bg-blue-50 border-blue-300 text-blue-700 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Exemplo
                    </Button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Envie seu documento Word</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Apenas .docx ou .doc • Máximo 10MB
                    </p>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="gap-2" disabled={isProcessing} asChild>
                        <span>
                          <FileText className="h-4 w-4" />
                          Selecionar Documento
                        </span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept=".docx,.doc"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                </div>

                {/* Arquivo selecionado */}
                {selectedFile && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {!isProcessing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            setValidationMessage(null)
                            setTokenInfo(null)
                            setActualTokenUsage(null)
                            setExtractedText(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mensagem de validação */}
              {validationMessage && (
                <div
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    validationMessage.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : validationMessage.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : validationMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {validationMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
                  <p
                    className={`text-sm ${
                      validationMessage.type === 'error'
                        ? 'text-red-800 dark:text-red-300'
                        : validationMessage.type === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-300'
                        : validationMessage.type === 'success'
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {validationMessage.message}
                  </p>
                </div>
              )}

              {/* Token Meter — aparece assim que um arquivo é selecionado */}
              {selectedFile && (
                <TokenMeter
                  isLoading={isExtracting}
                  extractedChars={tokenInfo?.extractedChars}
                  totalDocChars={tokenInfo?.totalDocChars}
                  estimatedPromptTokens={tokenInfo?.estimatedPromptTokens}
                  actualUsage={actualTokenUsage ?? undefined}
                  isGenerating={processingStep === 'generating'}
                />
              )}

              {/* Barra de progresso */}
              {isProcessing && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {processingStep === 'extracting' && 'Extraindo texto do documento...'}
                        {processingStep === 'generating' && 'Gerando curso com IA...'}
                        {processingStep === 'done' && 'Curso criado com sucesso!'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {processingStep === 'done' && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Redirecionando...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Botão de gerar */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateWithAI}
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                  disabled={!selectedFile || isProcessing || isExtracting || validationMessage?.type === 'error'}
                >
                  <Sparkles className="h-4 w-4" />
                  {isExtracting ? 'Analisando...' : isProcessing ? 'Processando...' : 'Gerar Curso'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
