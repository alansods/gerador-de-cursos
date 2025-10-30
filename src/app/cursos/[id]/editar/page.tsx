'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditarCursoPage() {
  const router = useRouter()
  const params = useParams()
  const { state, editarCurso } = useGeradorCurso()
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    cargaHoraria: '',
    modalidade: '',
    instrutor: '',
    categoria: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const cursoId = params.id as string
  const curso = state.cursos.find(c => c.id === cursoId)

  useEffect(() => {
    if (curso) {
      setFormData({
        titulo: curso.titulo,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        modalidade: curso.modalidade,
        instrutor: curso.instrutor,
        categoria: curso.categoria
      })
    }
  }, [curso])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.titulo.trim()) {
      alert('Por favor, insira um título para o curso')
      return
    }

    setIsLoading(true)
    
    try {
      editarCurso(cursoId, formData)
      router.push('/cursos')
    } catch (error) {
      console.error('Erro ao editar curso:', error)
      alert('Erro ao editar curso. Tente novamente.')
    } finally {
      setIsLoading(false)
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
        <div className="max-w-2xl mx-auto">
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Curso</h1>
              <p className="text-gray-600 mt-1">Modifique as informações do seu curso</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Curso</CardTitle>
              <CardDescription>
                Atualize as informações do seu curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="titulo" className="text-sm font-medium text-gray-700">
                      Título do Curso *
                    </label>
                    <Input
                      id="titulo"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleInputChange}
                      placeholder="Ex: Introdução ao React"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="categoria" className="text-sm font-medium text-gray-700">
                      Categoria
                    </label>
                    <Input
                      id="categoria"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      placeholder="Ex: Tecnologia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="descricao" className="text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o conteúdo e objetivos do curso"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="cargaHoraria" className="text-sm font-medium text-gray-700">
                      Carga Horária
                    </label>
                    <Input
                      id="cargaHoraria"
                      name="cargaHoraria"
                      value={formData.cargaHoraria}
                      onChange={handleInputChange}
                      placeholder="Ex: 40 horas"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="modalidade" className="text-sm font-medium text-gray-700">
                      Modalidade
                    </label>
                    <Input
                      id="modalidade"
                      name="modalidade"
                      value={formData.modalidade}
                      onChange={handleInputChange}
                      placeholder="Ex: Online"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="instrutor" className="text-sm font-medium text-gray-700">
                    Instrutor
                  </label>
                  <Input
                    id="instrutor"
                    name="instrutor"
                    value={formData.instrutor}
                    onChange={handleInputChange}
                    placeholder="Nome do instrutor"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
