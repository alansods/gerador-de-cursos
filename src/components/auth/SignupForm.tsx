'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function SignupForm() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [funcao, setFuncao] = useState('Professor(a) / Instrutor(a)')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [aceitoTermos, setAceitoTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordScore, setPasswordScore] = useState(0)
  const [errors, setErrors] = useState<{
    nome?: string
    email?: string
    funcao?: string
    senha?: string
    termos?: string
  }>({})
  const router = useRouter()

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter no mínimo 2 caracteres'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!funcao) {
      newErrors.funcao = 'Função é obrigatória'
    }

    if (!senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (senha.length < 8) {
      newErrors.senha = 'Senha deve ter no mínimo 8 caracteres'
    }

    if (!aceitoTermos) {
      newErrors.termos = 'Você deve aceitar os termos'
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
          cargo: funcao,
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
    <div className="form-content">
      <div className="form-head mb-7">
        <h2 className="text-[26px] font-medium tracking-tight text-foreground">Criar sua conta</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome */}
        <div className="field">
          <Label htmlFor="signup-nome" className="text-[13px] font-medium text-foreground">
            Nome<span className="text-[#F15A29] ml-0.5">*</span>
          </Label>
          <div className="input-wrap relative mt-1.5">
            <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              id="signup-nome"
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (errors.nome) {
                  setErrors({ ...errors, nome: undefined })
                }
              }}
              placeholder="Maria Oliveira"
              className={`pl-10 h-[42px] border-border rounded-lg bg-background text-sm ${
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
          <Label htmlFor="signup-email" className="text-[13px] font-medium text-foreground">
            E-mail<span className="text-[#F15A29] ml-0.5">*</span>
          </Label>
          <div className="input-wrap relative mt-1.5">
            <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors({ ...errors, email: undefined })
                }
              }}
              placeholder="maria.oliveira@senai.br"
              className={`pl-10 h-[42px] border-border rounded-lg bg-background text-sm ${
                errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {errors.email && <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>}
        </div>

        {/* Campo Função */}
        <div className="field">
          <Label htmlFor="signup-funcao" className="text-[13px] font-medium text-foreground">
            Função na instituição<span className="text-[#F15A29] ml-0.5">*</span>
          </Label>
          <div className="input-wrap relative mt-1.5">
            <Select
              value={funcao}
              onValueChange={(value) => {
                setFuncao(value)
                if (errors.funcao) {
                  setErrors({ ...errors, funcao: undefined })
                }
              }}
              disabled={loading}
            >
              <SelectTrigger
                id="signup-funcao"
                className={`h-[42px] ${errors.funcao ? 'border-red-500' : ''}`}
              >
                <SelectValue placeholder="Selecione sua função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professor(a) / Instrutor(a)">
                  Professor(a) / Instrutor(a)
                </SelectItem>
                <SelectItem value="Coordenador(a) pedagógico">Coordenador(a) pedagógico</SelectItem>
                <SelectItem value="Designer instrucional">Designer instrucional</SelectItem>
                <SelectItem value="Administrador(a)">Administrador(a)</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.funcao && <p className="text-xs text-red-500 mt-1.5">{errors.funcao}</p>}
        </div>

        {/* Campo Senha com Strength Meter */}
        <div className="field">
          <Label htmlFor="signup-senha" className="text-[13px] font-medium text-foreground">
            Senha<span className="text-[#F15A29] ml-0.5">*</span>
          </Label>
          <div className="input-wrap relative mt-1.5">
            <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              id="signup-senha"
              type={showPassword ? 'text' : 'password'}
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value)
                if (errors.senha) {
                  setErrors({ ...errors, senha: undefined })
                }
              }}
              placeholder="Mínimo 8 caracteres"
              className={`pl-10 pr-10 h-[42px] border-border rounded-lg bg-background text-sm ${
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

        {/* Checkbox Termos */}
        <div className="field">
          <div className="flex items-start space-x-2 py-1">
            <Checkbox
              id="termos"
              checked={aceitoTermos}
              onCheckedChange={(checked) => {
                setAceitoTermos(checked as boolean)
                if (errors.termos) {
                  setErrors({ ...errors, termos: undefined })
                }
              }}
              className={`h-[18px] w-[18px] mt-0.5 ${errors.termos ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            <label
              htmlFor="termos"
              className="text-[13px] leading-relaxed text-foreground cursor-pointer select-none"
            >
              Concordo com os{' '}
              <a href="#" className="text-[#0047BB] font-medium hover:underline">
                Termos de uso
              </a>{' '}
              e a{' '}
              <a href="#" className="text-[#0047BB] font-medium hover:underline">
                Política de privacidade
              </a>{' '}
              da plataforma.
            </label>
          </div>
          {errors.termos && <p className="text-xs text-red-500 mt-1.5">{errors.termos}</p>}
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
  )
}
