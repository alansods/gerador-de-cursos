'use client'

// Esta página não deve ser exportada estaticamente (usa API de autenticação)
export const dynamic = 'error'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GraduationCap, User, Lock, Eye, EyeOff, UserCircle } from 'lucide-react'

export default function LoginPage() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ usuario?: string; senha?: string }>({})
  const { login, loginAsGuest } = useAuth()
  const router = useRouter()

  const validate = () => {
    const newErrors: { usuario?: string; senha?: string } = {}

    if (!usuario.trim()) {
      newErrors.usuario = 'Usuário é obrigatório'
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    const success = await login(usuario.trim(), senha)
    setLoading(false)

    if (success) {
      router.push('/home')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-gray-900 p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0047BB] rounded-2xl mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-normal text-[#1A202C] dark:text-gray-100 mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400">
            Acesse o Gerador de Cursos SCORM
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E2E8F0] dark:border-gray-700 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuário */}
            <div className="space-y-2">
              <Label
                htmlFor="usuario"
                className="text-sm font-medium text-[#1A202C] dark:text-gray-200"
              >
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-gray-400 w-5 h-5" />
                <Input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value)
                    if (errors.usuario) {
                      setErrors({ ...errors, usuario: undefined })
                    }
                  }}
                  placeholder="Digite seu usuário"
                  className={`pl-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.usuario ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.usuario && <p className="text-sm text-red-500 mt-1">{errors.usuario}</p>}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label
                htmlFor="senha"
                className="text-sm font-medium text-[#1A202C] dark:text-gray-200"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-gray-400 w-5 h-5" />
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value)
                    if (errors.senha) {
                      setErrors({ ...errors, senha: undefined })
                    }
                  }}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.senha ? 'border-red-500 focus-visible:ring-red-500' : ''
                  }`}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto w-auto p-0 text-[#64748B] dark:text-gray-400 hover:text-[#1A202C] dark:hover:text-gray-100 hover:bg-transparent"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              {errors.senha && <p className="text-sm text-red-500 mt-1">{errors.senha}</p>}
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full h-9 bg-[#0047BB] hover:bg-[#0047BB]/90 text-white font-medium rounded-md"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B] dark:text-gray-400">
              Não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="text-sm font-medium text-[#0047BB] dark:text-blue-400 hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </div>

          {/* Divisória OU */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">OU</span>
            </div>
          </div>

          {/* Botão Entrar como Convidado */}
          <Button
            type="button"
            variant="outline"
            onClick={loginAsGuest}
            disabled={loading}
            className="w-full"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            Entrar como Convidado
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-2">
            Teste todas as funcionalidades sem compromisso
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#64748B] dark:text-gray-400">
          © 2025 Gerador de Cursos SCORM. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
