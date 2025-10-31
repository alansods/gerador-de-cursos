'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await criarCurso({ ...formData, unidades: [] })
      router.push('/cursos')
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      // Poderia adicionar um toast aqui
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
