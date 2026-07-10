'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrandPanel } from '@/components/auth/BrandPanel'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export const dynamic = 'error'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)
  const [errors, setErrors] = useState<{
    nome?: string
    email?: string
    senha?: string
    confirmarSenha?: string
  }>({})
  const router = useRouter()

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter no mínimo 2 caracteres'
    }

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (senha.length < 8) {
      newErrors.senha = 'Senha deve ter no mínimo 8 caracteres'
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória'
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem'
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
    try {
      const nomeCompleto = nome.trim()
      const usuario = email ? email.split('@')[0] : nome.trim().toLowerCase()

      const response = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nomeCompleto,
          usuario,
          senha,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Conta criada! Faça login para continuar')
        router.push('/login')
      } else {
        toast.error(data.error || 'Erro ao realizar cadastro')
        if (data.error?.includes('já cadastrado')) {
          setErrors({ ...errors, email: data.error })
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="auth-layout">
        <BrandPanel />

        <main className="form-panel">
          <div className="form-wrap flex-1 flex items-center justify-center py-12">
            <div className="form-inner w-full max-w-[420px]">
              <div className="form-head mb-7">
                <h2 className="text-[26px] font-medium tracking-tight text-foreground">
                  Criar sua conta
                </h2>
                <p className="text-[15px] text-muted-foreground mt-2">
                  Preencha os dados abaixo para começar.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nome */}
                <div className="field">
                  <Label
                    htmlFor="cadastro-nome"
                    className="text-[13px] font-medium text-foreground"
                  >
                    Nome<span className="text-[#F15A29] ml-0.5">*</span>
                  </Label>
                  <div className="input-wrap relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-nome"
                      type="text"
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value)
                        if (errors.nome) {
                          setErrors({ ...errors, nome: undefined })
                        }
                      }}
                      placeholder="Maria Oliveira"
                      className={`pl-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                        errors.nome ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                  {errors.nome && <p className="text-xs text-red-500 mt-1.5">{errors.nome}</p>}
                </div>

                {/* Campo E-mail */}
                <div className="field">
                  <Label
                    htmlFor="cadastro-email"
                    className="text-[13px] font-medium text-foreground"
                  >
                    E-mail<span className="text-[#F15A29] ml-0.5">*</span>
                  </Label>
                  <div className="input-wrap relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) {
                          setErrors({ ...errors, email: undefined })
                        }
                      }}
                      placeholder="maria.oliveira@senai.br"
                      className={`pl-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                        errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
                </div>

                {/* Campo Senha com Strength Meter */}
                <div className="field">
                  <Label
                    htmlFor="cadastro-senha"
                    className="text-[13px] font-medium text-foreground"
                  >
                    Senha<span className="text-[#F15A29] ml-0.5">*</span>
                  </Label>
                  <div className="input-wrap relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-senha"
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value)
                        if (errors.senha) {
                          setErrors({ ...errors, senha: undefined })
                        }
                      }}
                      placeholder="Mínimo 8 caracteres"
                      className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                        errors.senha ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-[30px] w-[30px] text-muted-foreground hover:bg-muted rounded-md"
                      tabIndex={-1}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {errors.senha && <p className="text-xs text-red-500 mt-1.5">{errors.senha}</p>}

                  {/* Password Strength Meter */}
                  <PasswordStrengthMeter password={senha} onChange={setPasswordScore} />
                </div>

                {/* Campo Confirmar Senha */}
                <div className="field">
                  <Label
                    htmlFor="cadastro-confirmar-senha"
                    className="text-[13px] font-medium text-foreground"
                  >
                    Confirmar senha<span className="text-[#F15A29] ml-0.5">*</span>
                  </Label>
                  <div className="input-wrap relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-confirmar-senha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => {
                        setConfirmarSenha(e.target.value)
                        if (errors.confirmarSenha) {
                          setErrors({ ...errors, confirmarSenha: undefined })
                        }
                      }}
                      placeholder="Digite a senha novamente"
                      className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-white text-sm ${
                        errors.confirmarSenha ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-[30px] w-[30px] text-muted-foreground hover:bg-muted rounded-md"
                      tabIndex={-1}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-xs text-red-500 mt-1.5">{errors.confirmarSenha}</p>
                  )}
                </div>

                {/* Botão Criar Conta */}
                <Button
                  type="submit"
                  className="w-full h-[44px] bg-[#0047BB] hover:bg-[#003A99] text-white font-medium rounded-lg mt-5"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                      Criando conta...
                    </span>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Link para Login */}
              <p className="switch-copy text-center mt-5 text-[13px] text-muted-foreground">
                Já tem conta?{' '}
                <Link href="/login" className="text-[#0047BB] font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .auth-layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
        }

        .form-panel {
          display: flex;
          flex-direction: column;
          padding: 40px 56px;
          overflow-y: auto;
          background: var(--bg, #f5f7fa);
        }

        @media (max-width: 980px) {
          .auth-layout {
            grid-template-columns: 1fr;
          }

          .form-panel {
            padding: 32px 24px;
          }
        }

        @media (max-width: 480px) {
          .form-panel {
            padding: 24px 16px;
          }
        }
      `}</style>
    </>
  )
}
