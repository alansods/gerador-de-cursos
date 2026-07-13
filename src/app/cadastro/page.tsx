'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { BrandPanel } from '@/components/auth/BrandPanel'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const dynamic = 'error'

export default function CadastroPage() {
  const t = useTranslations('auth')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, setPasswordScore] = useState(0)
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
      newErrors.nome = t('validation.nameRequired')
    } else if (nome.trim().length < 2) {
      newErrors.nome = t('validation.nameRequired')
    }

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!senha) {
      newErrors.senha = t('validation.passwordRequired')
    } else if (senha.length < 8) {
      newErrors.senha = t('validation.passwordMinLength')
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = t('validation.confirmPasswordRequired')
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = t('validation.passwordsNotMatch')
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
        toast.success(t('success.signupSuccess'))
        router.push('/login')
      } else {
        toast.error(data.error || t('errors.signupFailed'))
        if (data.error?.includes('já cadastrado') || data.error?.includes('already exists')) {
          setErrors({ ...errors, email: t('errors.userExists') })
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      toast.error(t('errors.serverError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="auth-layout">
        <BrandPanel />

        <main className="form-panel">
          <div className="form-wrap flex-1 flex items-center justify-center py-12">
            <div className="form-inner w-full max-w-[420px]">
              <div className="form-head mb-7">
                <h2 className="text-[26px] font-medium tracking-tight text-foreground">
                  {t('signup.title')}
                </h2>
                <p className="text-[15px] text-muted-foreground mt-2">{t('signup.subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nome */}
                <div className="field">
                  <Label
                    htmlFor="cadastro-nome"
                    className="text-[13px] font-medium text-foreground"
                  >
                    {t('signup.name')}
                    <span className="text-[#F15A29] ml-0.5">*</span>
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
                      placeholder={t('signup.namePlaceholder')}
                      className={`pl-10 h-[42px] border-border rounded-lg bg-white dark:bg-input-background text-sm ${
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
                    {t('signup.email')}
                    <span className="text-[#F15A29] ml-0.5">*</span>
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
                      placeholder={t('signup.emailPlaceholder')}
                      className={`pl-10 h-[42px] border-border rounded-lg bg-white dark:bg-input-background text-sm ${
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
                    {t('signup.password')}
                    <span className="text-[#F15A29] ml-0.5">*</span>
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
                      placeholder={t('signup.passwordPlaceholder')}
                      className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-white dark:bg-input-background text-sm ${
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
                    {t('signup.confirmPassword')}
                    <span className="text-[#F15A29] ml-0.5">*</span>
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
                      placeholder={t('signup.confirmPasswordPlaceholder')}
                      className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-white dark:bg-input-background text-sm ${
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
                      {t('signup.signingUp')}
                    </span>
                  ) : (
                    <>
                      {t('signup.signUp')}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Link para Login */}
              <p className="switch-copy text-center mt-5 text-[13px] text-muted-foreground">
                {t('signup.hasAccount')}{' '}
                <Link href="/login" className="text-[#0047BB] font-medium hover:underline">
                  {t('signup.signInLink')}
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

        :global(.dark) .form-panel {
          background: var(--neutral-950);
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
