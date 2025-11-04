"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Download,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: "Criação de Cursos",
      description:
        "Crie cursos completos com unidades, aulas e conteúdo rico de forma simples e intuitiva.",
    },
    {
      icon: FileText,
      title: "Editor Avançado",
      description:
        "Edite e personalize seu conteúdo com componentes interativos, quizzes e muito mais.",
    },
    {
      icon: Download,
      title: "Exportação SCORM",
      description:
        "Exporte seus cursos no formato SCORM padrão para integração com LMS (Learning Management Systems).",
    },
    {
      icon: Zap,
      title: "Performance",
      description:
        "Interface rápida e responsiva para uma experiência fluida na criação e visualização de cursos.",
    },
    {
      icon: Shield,
      title: "Seguro",
      description:
        "Seus cursos são salvos de forma segura e você tem controle total sobre seu conteúdo.",
    },
    {
      icon: CheckCircle,
      title: "Padrões Educacionais",
      description:
        "Crie cursos que seguem os padrões educacionais mais modernos e eficazes.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900 rounded-full mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bem-vindo{user ? `, ${user.nome.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema completo para criação, gerenciamento e exportação de cursos
            em formato SCORM
          </p>
        </div>

        {/* Sobre o Sistema */}
        <Card className="mb-12 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-900" />
              Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                O <strong>Gerador de Cursos SCORM</strong> é uma plataforma
                completa e intuitiva projetada para educadores, instrutores e
                criadores de conteúdo que desejam desenvolver cursos online
                profissionais e exportá-los no formato SCORM (Sharable Content
                Object Reference Model).
              </p>
              <p className="leading-relaxed">
                Com nosso sistema, você pode criar cursos estruturados com
                múltiplas unidades e aulas, adicionar conteúdo rico incluindo
                textos, imagens, vídeos, quizzes interativos e muito mais.
                Tudo isso em uma interface amigável que não requer conhecimento
                técnico avançado.
              </p>
              <p className="leading-relaxed">
                O sistema permite exportar seus cursos no formato SCORM, o que
                significa que você pode integrá-los facilmente com qualquer LMS
                (Learning Management System) popular, como Moodle, Canvas,
                Blackboard, entre outros. Isso garante compatibilidade e
                portabilidade do seu conteúdo educacional.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Funcionalidades Principais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <Icon className="w-6 h-6 text-blue-900" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para começar a criar seus cursos?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Acesse a página de cursos para criar seu primeiro curso ou
              gerenciar cursos existentes.
            </p>
            <Link href="/cursos">
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-gray-100 font-semibold"
              >
                Ir para Cursos
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

