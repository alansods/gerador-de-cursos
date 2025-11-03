"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  GraduationCap,
  User,
  Briefcase,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nome?: string;
    cargo?: string;
    usuario?: string;
    senha?: string;
    confirmarSenha?: string;
  }>({});
  const router = useRouter();

  const validate = () => {
    const newErrors: {
      nome?: string;
      cargo?: string;
      usuario?: string;
      senha?: string;
      confirmarSenha?: string;
    } = {};

    if (!nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter no mínimo 2 caracteres";
    }

    if (!cargo.trim()) {
      newErrors.cargo = "Cargo é obrigatório";
    } else if (cargo.trim().length < 2) {
      newErrors.cargo = "Cargo deve ter no mínimo 2 caracteres";
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
          cargo: cargo.trim(),
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crie sua conta
          </h1>
          <p className="text-gray-600">Preencha os dados para se cadastrar</p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-gray-700 font-medium">
                Nome Completo
              </Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                  placeholder="Digite seu nome completo"
                  className={`pl-10 h-12 ${
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

            {/* Campo Cargo */}
            <div className="space-y-2">
              <Label htmlFor="cargo" className="text-gray-700 font-medium">
                Cargo
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => {
                    setCargo(e.target.value);
                    if (errors.cargo) {
                      setErrors({ ...errors, cargo: undefined });
                    }
                  }}
                  placeholder="Digite seu cargo"
                  className={`pl-10 h-12 ${
                    errors.cargo
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.cargo && (
                <p className="text-sm text-red-500 mt-1">{errors.cargo}</p>
              )}
            </div>

            {/* Campo Usuário */}
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-gray-700 font-medium">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                  placeholder="Escolha um nome de usuário"
                  className={`pl-10 h-12 ${
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
              <Label htmlFor="senha" className="text-gray-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                  placeholder="Digite uma senha (mín. 6 caracteres)"
                  className={`pl-10 pr-10 h-12 ${
                    errors.senha
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-500 mt-1">{errors.senha}</p>
              )}
            </div>

            {/* Campo Confirmar Senha */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmarSenha"
                className="text-gray-700 font-medium"
              >
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                  placeholder="Digite a senha novamente"
                  className={`pl-10 pr-10 h-12 ${
                    errors.confirmarSenha
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
              className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mt-6"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Cadastrando...
                </span>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-blue-900 font-semibold hover:text-blue-800 hover:underline transition-colors"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Gerador de Cursos SCORM © 2025
        </p>
      </div>
    </div>
  );
}
