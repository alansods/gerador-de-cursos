"use client";

// Esta página não deve ser exportada estaticamente (usa API de autenticação)
export const dynamic = 'error';

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GraduationCap, User, Lock, Eye, EyeOff } from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nome?: string;
    usuario?: string;
    senha?: string;
    confirmarSenha?: string;
  }>({});
  const router = useRouter();

  const validate = () => {
    const newErrors: {
      nome?: string;
      usuario?: string;
      senha?: string;
      confirmarSenha?: string;
    } = {};

    if (!nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório";
    } else if (nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter no mínimo 2 caracteres";
    }

    if (!usuario.trim()) {
      newErrors.usuario = "Usuário é obrigatório";
    } else if (usuario.trim().length < 3) {
      newErrors.usuario = "Usuário deve ter no mínimo 3 caracteres";
    }

    if (!senha) {
      newErrors.senha = "Senha é obrigatória";
    } else if (senha.length < 6) {
      newErrors.senha = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!confirmarSenha) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    } else if (senha !== confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          usuario: usuario.trim(),
          senha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Cadastro realizado com sucesso!");
        router.push("/login");
      } else {
        toast.error(data.error || "Erro ao realizar cadastro");
        if (data.error?.includes("já cadastrado")) {
          setErrors({ ...errors, usuario: data.error });
        }
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-gray-900 p-4 py-8">
      <ThemeToggle />
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0047BB] rounded-2xl mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-normal text-[#1A202C] dark:text-gray-100 mb-2">
            Criar sua conta
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400">
            Comece a criar cursos SCORM com qualidade SENAI
          </p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E2E8F0] dark:border-gray-700 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label
                htmlFor="nome"
                className="text-sm font-medium text-[#1A202C] dark:text-gray-200"
              >
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-gray-400 w-5 h-5" />
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    if (errors.nome) {
                      setErrors({ ...errors, nome: undefined });
                    }
                  }}
                  placeholder="João Silva"
                  className={`pl-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.nome
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.nome && (
                <p className="text-sm text-red-500 mt-1">{errors.nome}</p>
              )}
            </div>

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
                    setUsuario(e.target.value);
                    if (errors.usuario) {
                      setErrors({ ...errors, usuario: undefined });
                    }
                  }}
                  placeholder="Digite seu usuário"
                  className={`pl-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.usuario
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.usuario && (
                <p className="text-sm text-red-500 mt-1">{errors.usuario}</p>
              )}
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
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (errors.senha) {
                      setErrors({ ...errors, senha: undefined });
                    }
                    if (errors.confirmarSenha && confirmarSenha) {
                      setErrors({ ...errors, confirmarSenha: undefined });
                    }
                  }}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.senha
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
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
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-500 mt-1">{errors.senha}</p>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmarSenha"
                className="text-sm font-medium text-[#1A202C] dark:text-gray-200"
              >
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] dark:text-gray-400 w-5 h-5" />
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => {
                    setConfirmarSenha(e.target.value);
                    if (errors.confirmarSenha) {
                      setErrors({ ...errors, confirmarSenha: undefined });
                    }
                  }}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-9 border-[#E2E8F0] dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 ${
                    errors.confirmarSenha
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto w-auto p-0 text-[#64748B] dark:text-gray-400 hover:text-[#1A202C] dark:hover:text-gray-100 hover:bg-transparent"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </Button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmarSenha}
                </p>
              )}
            </div>

            {/* Botão de Cadastro */}
            <Button
              type="submit"
              className="w-full h-9 bg-[#0047BB] hover:bg-[#0047BB]/90 text-white font-medium rounded-md"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Cadastrando...
                </span>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B] dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-sm font-medium text-[#0047BB] dark:text-blue-400 hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#64748B] dark:text-gray-400">
          © 2025 SENAI. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
