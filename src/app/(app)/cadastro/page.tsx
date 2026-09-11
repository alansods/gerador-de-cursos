'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageToggle } from '@/components/LanguageToggle'
import { BrandPanel } from '@/components/auth/BrandPanel'
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const dynamic = 'error'

export default function SignupPage() {
  const t = useTranslations('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    if (!name.trim()) {
      newErrors.nome = t('validation.nameRequired')
    } else if (name.trim().length < 2) {
      newErrors.nome = t('validation.nameRequired')
    }

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!password) {
      newErrors.senha = t('validation.passwordRequired')
    } else if (password.length < 8) {
      newErrors.senha = t('validation.passwordMinLength')
    }

    if (!confirmPassword) {
      newErrors.confirmarSenha = t('validation.confirmPasswordRequired')
    } else if (password !== confirmPassword) {
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
      const fullName = name.trim()
      const user = email ? email.split('@')[0] : name.trim().toLowerCase()

      const response = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: fullName,
          usuario: user,
          senha: password,
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
                <FormField
                  label={
                    <>
                      {t('signup.name')}
                      <span className="text-highlight ml-0.5">*</span>
                    </>
                  }
                  htmlFor="cadastro-nome"
                  error={errors.nome}
                  showError={!!errors.nome}
                >
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-nome"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
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
                </FormField>

                {/* Campo E-mail */}
                <FormField
                  label={
                    <>
                      {t('signup.email')}
                      <span className="text-highlight ml-0.5">*</span>
                    </>
                  }
                  htmlFor="cadastro-email"
                  error={errors.email}
                  showError={!!errors.email}
                >
                  <div className="relative">
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
                </FormField>

                {/* Campo Senha com Strength Meter */}
                <FormField
                  label={
                    <>
                      {t('signup.password')}
                      <span className="text-highlight ml-0.5">*</span>
                    </>
                  }
                  htmlFor="cadastro-senha"
                  error={errors.senha}
                  showError={!!errors.senha}
                >
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-senha"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
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
                  <PasswordStrengthMeter password={password} onChange={setPasswordScore} />
                </FormField>

                {/* Campo Confirmar Senha */}
                <FormField
                  label={
                    <>
                      {t('signup.confirmPassword')}
                      <span className="text-highlight ml-0.5">*</span>
                    </>
                  }
                  htmlFor="cadastro-confirmar-senha"
                  error={errors.confirmarSenha}
                  showError={!!errors.confirmarSenha}
                >
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      id="cadastro-confirmar-senha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
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
                </FormField>

                {/* Botão Criar Conta */}
                <Button
                  type="submit"
                  className="w-full h-[44px] font-medium rounded-lg mt-5"
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
                <Link href="/login" className="text-primary font-medium hover:underline">
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
          background: var(--background);
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
