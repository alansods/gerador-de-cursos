'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/AuthContext'
import { User, Lock, Eye, EyeOff, UserCircle, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGuest, setLoadingGuest] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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

  const handleGuestLogin = async () => {
    setLoadingGuest(true)
    await loginAsGuest()
    setLoadingGuest(false)
  }

  return (
    <div className="form-content">
      <div className="form-head mb-7">
        <h2 className="text-[26px] font-medium tracking-tight text-foreground">Bem-vindo</h2>
        <p className="text-[15px] text-muted-foreground mt-2">
          Entre com sua conta institucional para acessar seus cursos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Usuário */}
        <div className="field">
          <Label htmlFor="login-usuario" className="text-[13px] font-medium text-foreground">
            Usuário
          </Label>
          <div className="input-wrap relative mt-1.5">
            <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              id="login-usuario"
              type="text"
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value)
                if (errors.usuario) {
                  setErrors({ ...errors, usuario: undefined })
                }
              }}
              placeholder="Digite seu usuário"
              className={`pl-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                errors.usuario ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              disabled={loading || loadingGuest}
              autoComplete="username"
            />
          </div>
          {errors.usuario && <p className="text-xs text-red-500 mt-1.5">{errors.usuario}</p>}
        </div>

        {/* Campo Senha */}
        <div className="field">
          <Label htmlFor="login-senha" className="text-[13px] font-medium text-foreground">
            Senha
          </Label>
          <div className="input-wrap relative mt-1.5">
            <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              id="login-senha"
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (errors.senha) {
                  setErrors({ ...errors, senha: undefined })
                }
              }}
              placeholder="••••••••"
              className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                errors.senha ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              disabled={loading || loadingGuest}
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-[30px] w-[30px] text-muted-foreground hover:bg-muted rounded-md"
              tabIndex={-1}
              disabled={loading || loadingGuest}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {errors.senha && <p className="text-xs text-red-500 mt-1.5">{errors.senha}</p>}
        </div>

        {/* Lembrar de mim + Esqueceu senha */}
        <div className="check-row flex items-center justify-between py-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="h-[18px] w-[18px]"
              disabled={loading || loadingGuest}
            />
            <label
              htmlFor="remember-me"
              className="text-[13px] text-foreground cursor-pointer select-none"
            >
              Lembrar de mim
            </label>
          </div>
          <button
            type="button"
            className="text-[13px] font-medium text-[#0047BB] hover:underline"
            disabled={loading || loadingGuest}
          >
            Esqueceu a senha?
          </button>
        </div>

        {/* Botão Entrar */}
        <Button
          type="submit"
          className="w-full h-[44px] bg-[#0047BB] hover:bg-[#003A99] text-white font-medium rounded-lg mt-5"
          disabled={loading || loadingGuest}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              Entrando...
            </span>
          ) : (
            <>
              Entrar
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Link para Cadastro */}
      <p className="switch-copy text-center mt-5 text-[13px] text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="text-[#0047BB] font-medium hover:underline">
          Criar conta gratuita
        </Link>
      </p>

      {/* Divisor OU */}
      <div className="divider flex items-center gap-3 my-5 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        OU
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Botão Entrar como Convidado */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGuestLogin}
        disabled={loading || loadingGuest}
        className="w-full h-[44px] rounded-lg font-medium text-sm border-border bg-white hover:bg-muted"
      >
        {loadingGuest ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
            Entrando...
          </span>
        ) : (
          <>
            <UserCircle className="mr-2 w-4 h-4" />
            Entrar como Convidado
          </>
        )}
      </Button>
    </div>
  )
}
