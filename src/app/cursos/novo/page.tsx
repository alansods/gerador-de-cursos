'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Save, Upload, FileText, Sparkles, CheckCircle2, AlertCircle, Info, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function NovoCursoPage() {
  const router = useRouter()
  const { criarCurso } = useGeradorCurso()

  const [formData, setFormData] = useState({
    titulo: '',
    categoria: '',
    descricao: '',
    cargaHoraria: '',
    modalidade: '',
    instrutor: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Estados para a geração por IA
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<'idle' | 'extracting' | 'generating' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [validationMessage, setValidationMessage] = useState<{
    type: 'error' | 'warning' | 'success' | 'info'
    message: string
  } | null>(null)

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
    if (!formData.instrutor.trim()) next.instrutor = 'Instrutor é obrigatório'
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
    } else {
      setSelectedFile(null)
    }
  }

  const handleDownloadExample = async () => {
    try {
      // Buscar o arquivo de exemplo em DOCX
      const response = await fetch('/roteiro/exemplo-curso-pizza.docx')
      if (!response.ok) throw new Error('Erro ao buscar exemplo')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'exemplo-curso-pizza.docx'
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
    setProcessingStep('extracting')
    setProgress(10)

    try {
      // Passo 1: Extrair texto do documento
      const formData = new FormData()
      formData.append('file', selectedFile)

      setProgress(20)
      const extractResponse = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      })

      if (!extractResponse.ok) {
        const error = await extractResponse.json()
        throw new Error(error.message || 'Erro ao extrair texto do documento')
      }

      const { text } = await extractResponse.json()
      setProgress(40)
      
      // Passo 2: Gerar curso com IA
      setProcessingStep('generating')
      setProgress(50)

      const generateResponse = await fetch('/api/generate-course-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        throw new Error(error.message || 'Erro ao gerar curso')
      }

      const { course } = await generateResponse.json()
      setProgress(80)

      // Passo 3: Criar curso no banco
      await criarCurso(course)
      setProgress(100)
      setProcessingStep('done')

      // Toast de sucesso
      toast.success('Curso gerado com sucesso! 🎉', {
        description: `"${course.titulo}" foi criado e está pronto para edição.`
      })

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
      
      toast.error('Erro ao gerar curso', {
        description: errorMessage
      })
      
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
      toast.success('Curso criado com sucesso! 🎉', {
        description: `"${formData.titulo}" foi criado e está pronto para adicionar unidades.`
      })
      router.push('/cursos')
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      toast.error('Erro ao criar curso', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Novo Curso</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <label htmlFor="titulo" className="text-sm font-medium text-gray-700">Título do Curso *</label>
                  <Input id="titulo" value={formData.titulo} onChange={(e) => setField('titulo', e.target.value)} placeholder="Ex: Introdução ao React" className={errors.titulo ? 'border-red-500' : ''} />
                  {errors.titulo && <p className="text-sm text-red-600">{errors.titulo}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="categoria" className="text-sm font-medium text-gray-700">Categoria *</label>
                  <Input id="categoria" value={formData.categoria} onChange={(e) => setField('categoria', e.target.value)} placeholder="Ex: Programação, Design, Marketing" className={errors.categoria ? 'border-red-500' : ''} />
                  {errors.categoria && <p className="text-sm text-red-600">{errors.categoria}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="descricao" className="text-sm font-medium text-gray-700">Descrição *</label>
                <textarea id="descricao" value={formData.descricao} onChange={(e) => setField('descricao', e.target.value)} placeholder="Descreva o que os alunos aprenderão neste curso..." rows={5} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.descricao ? 'border-red-500' : ''}`} />
                {errors.descricao && <p className="text-sm text-red-600">{errors.descricao}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="cargaHoraria" className="text-sm font-medium text-gray-700">Carga Horária *</label>
                  <Input id="cargaHoraria" value={formData.cargaHoraria} onChange={(e) => setField('cargaHoraria', e.target.value)} placeholder="Ex: 40 horas" className={errors.cargaHoraria ? 'border-red-500' : ''} />
                  {errors.cargaHoraria && <p className="text-sm text-red-600">{errors.cargaHoraria}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="modalidade" className="text-sm font-medium text-gray-700">Modalidade *</label>
                  <Input id="modalidade" value={formData.modalidade} onChange={(e) => setField('modalidade', e.target.value)} placeholder="Ex: Online, Presencial, Híbrido" className={errors.modalidade ? 'border-red-500' : ''} />
                  {errors.modalidade && <p className="text-sm text-red-600">{errors.modalidade}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="instrutor" className="text-sm font-medium text-gray-700">Instrutor *</label>
                  <Input id="instrutor" value={formData.instrutor} onChange={(e) => setField('instrutor', e.target.value)} placeholder="Nome do instrutor" className={errors.instrutor ? 'border-red-500' : ''} />
                  {errors.instrutor && <p className="text-sm text-red-600">{errors.instrutor}</p>}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-blue-900">Como funciona a geração por IA?</h3>
                      <p className="text-sm text-blue-800">
                        Envie um documento Word (.docx ou .doc) estruturado com o conteúdo do curso.
                        A IA irá processar o documento e criar automaticamente o curso com unidades e conteúdo organizados.
                      </p>
                      <p className="text-sm text-blue-800 font-medium">
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">Envie seu documento Word</h3>
                    <p className="text-sm text-gray-600 mb-4">
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
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
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
                      ? 'bg-red-50 border-red-200'
                      : validationMessage.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : validationMessage.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  {validationMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
                  {validationMessage.type === 'info' && <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />}
                  <p
                    className={`text-sm ${
                      validationMessage.type === 'error'
                        ? 'text-red-800'
                        : validationMessage.type === 'warning'
                        ? 'text-yellow-800'
                        : validationMessage.type === 'success'
                        ? 'text-green-800'
                        : 'text-blue-800'
                    }`}
                  >
                    {validationMessage.message}
                  </p>
                </div>
              )}

              {/* Barra de progresso */}
              {isProcessing && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {processingStep === 'extracting' && 'Extraindo texto do documento...'}
                        {processingStep === 'generating' && 'Gerando curso com IA...'}
                        {processingStep === 'done' && 'Curso criado com sucesso!'}
                      </span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {processingStep === 'done' && (
                    <div className="flex items-center gap-2 text-green-600 justify-center">
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
                  disabled={!selectedFile || isProcessing || validationMessage?.type === 'error'}
                >
                  <Sparkles className="h-4 w-4" />
                  {isProcessing ? 'Processando...' : 'Gerar Curso'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
