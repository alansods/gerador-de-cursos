'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { useSCORM } from '@/hooks/useSCORM'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Edit, Eye } from 'lucide-react'

export default function PreviewCursoPage() {
  const router = useRouter()
  const params = useParams()
  const { state } = useGeradorCurso()
  const { generateSCORMPackage } = useSCORM()
  const [isGenerating, setIsGenerating] = useState(false)

  const cursoId = params.id as string
  const curso = state.cursos.find(c => c.id === cursoId)

  const handleGenerateSCORM = async () => {
    if (!curso) return
    
    setIsGenerating(true)
    try {
      await generateSCORMPackage(curso)
    } catch (error) {
      console.error('Erro ao gerar SCORM:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
          <Button onClick={() => router.push('/cursos')}>
            Voltar para Cursos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{curso.titulo}</h1>
              <p className="text-gray-600 mt-1">Preview do curso</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/cursos/${curso.id}/editar`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleGenerateSCORM}
                disabled={isGenerating}
                className="flex items-center gap-2 scorm-button"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? 'Gerando...' : 'SCORM'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Descrição do Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {curso.descricao || 'Nenhuma descrição fornecida.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do Curso</CardTitle>
                  <CardDescription>
                    {curso.unidades.length} unidades disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {curso.unidades.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma unidade criada ainda.</p>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/cursos/${curso.id}/editar`)}
                        className="mt-4"
                      >
                        Adicionar Unidades
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {curso.unidades.map((unidade, index) => (
                        <div
                          key={unidade.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Unidade {index + 1}: {unidade.titulo}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {unidade.conteudo.length} itens de conteúdo
                              </p>
                            </div>
                            <Badge variant="secondary">
                              {unidade.conteudo.length} itens
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Categoria</label>
                    <p className="text-gray-900">{curso.categoria}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Carga Horária</label>
                    <p className="text-gray-900">{curso.cargaHoraria}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Modalidade</label>
                    <p className="text-gray-900">{curso.modalidade}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Instrutor</label>
                    <p className="text-gray-900">{curso.instrutor}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Criado em</label>
                    <p className="text-gray-900">
                      {new Date(curso.dataCriacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Última modificação</label>
                    <p className="text-gray-900">
                      {new Date(curso.dataModificacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exportar</CardTitle>
                  <CardDescription>
                    Gere o pacote SCORM do curso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateSCORM}
                    disabled={isGenerating || curso.unidades.length === 0}
                    className="w-full flex items-center gap-2 scorm-button"
                  >
                    <Download className="h-4 w-4" />
                    {isGenerating ? 'Gerando...' : 'Gerar SCORM'}
                  </Button>
                  {curso.unidades.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Adicione unidades ao curso para gerar o SCORM
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
