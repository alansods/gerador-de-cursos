'use client'

import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function CursosPage() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso()
  const router = useRouter()
  const [cursoParaDeletar, setCursoParaDeletar] = useState<string | null>(null)

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erro:</strong>
            <span className="block sm:inline"> {state.error}</span>
          </div>
        </div>
      </div>
    )
  }

  const handleCriarCurso = () => router.push('/cursos/novo')
  const handleEditarCurso = (id: string) => { selecionarCurso(id); router.push(`/cursos/${id}/editar`) }
  const handleVisualizarCurso = (id: string) => { selecionarCurso(id); router.push(`/cursos/${id}/preview`) }
  const handleDeletarCurso = (id: string) => setCursoParaDeletar(id)
  const confirmarDelecao = () => { if (cursoParaDeletar) { deletarCurso(cursoParaDeletar); setCursoParaDeletar(null) } }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Cursos</h1>
            <p className="text-gray-600 mt-2">Gerencie e crie seus cursos SCORM</p>
          </div>
          <Button onClick={handleCriarCurso} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Curso
          </Button>
        </div>

        {state.cursos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso criado</h3>
            <p className="text-gray-600 mb-6">Comece criando seu primeiro curso SCORM</p>
            <Button onClick={handleCriarCurso} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Curso
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.cursos.map((curso) => (
              <Card key={curso.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {curso.titulo}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {curso.descricao}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {curso.categoria}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex justify-between"><span>Carga Horária:</span><span>{curso.cargaHoraria}</span></div>
                    <div className="flex justify-between"><span>Modalidade:</span><span>{curso.modalidade}</span></div>
                    <div className="flex justify-between"><span>Instrutor:</span><span>{curso.instrutor}</span></div>
                    <div className="flex justify-between"><span>Unidades:</span><span>{curso.unidades.length}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleVisualizarCurso(curso.id)} className="flex-1">
                      <Eye className="h-4 w-4 mr-1" /> Visualizar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditarCurso(curso.id)} className="flex-1">
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeletarCurso(curso.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={cursoParaDeletar !== null} onOpenChange={setCursoParaDeletar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCursoParaDeletar(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={confirmarDelecao}>Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
