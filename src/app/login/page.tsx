"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ usuario?: string; senha?: string }>(
    {}
  );
  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors: { usuario?: string; senha?: string } = {};

    if (!usuario.trim()) {
      newErrors.usuario = "Usuário é obrigatório";
    }

    if (!senha) {
      newErrors.senha = "Senha é obrigatória";
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
    const success = await login(usuario.trim(), senha);
    setLoading(false);

    if (success) {
      router.push("/home");
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
            Bem-vindo de volta
          </h1>
          <p className="text-gray-600">Faça login para continuar</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Digite seu usuário"
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
                  }}
                  placeholder="Digite sua senha"
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

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="text-blue-900 font-semibold hover:text-blue-800 hover:underline transition-colors"
              >
                Cadastre-se
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
