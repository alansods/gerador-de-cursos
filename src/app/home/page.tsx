"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  Plus,
  ArrowRight,
  CheckCircle2,
  Users,
  FileCheck,
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export default function HomePage() {
  const router = useRouter();

  const features = [
    {
      icon: BookOpen,
      title: "Padrão SCORM",
      description:
        "Gere cursos compatíveis com SCORM 1.2 e 2004, garantindo interoperabilidade com qualquer LMS.",
      iconBg: "bg-[#F15A29]/10",
      iconColor: "#F15A29",
    },
    {
      icon: Clock,
      title: "Criação Rápida",
      description:
        "Automatize a geração de pacotes SCORM e reduza o tempo de produção de cursos.",
      iconBg: "bg-[#F15A29]/10",
      iconColor: "#F15A29",
    },
    {
      icon: Award,
      title: "Qualidade SENAI",
      description:
        "Mantenha o padrão de excelência SENAI com templates e estruturas validadas.",
      iconBg: "bg-[#F15A29]/10",
      iconColor: "#F15A29",
    },
  ];

  const recentActivities = [
    {
      icon: CheckCircle2,
      title: "Novo curso publicado:",
      subtitle: "Fundamentos de Desenvolvimento Web",
      time: "Há 2 horas",
      iconBg: "bg-[#0047BB]/10",
      iconColor: "#0047BB",
    },
    {
      icon: Users,
      title: "128 novos alunos",
      subtitle: "matriculados hoje",
      time: "Há 5 horas",
      iconBg: "bg-[#F15A29]/10",
      iconColor: "#F15A29",
    },
    {
      icon: FileCheck,
      title: "45 certificados",
      subtitle: "emitidos esta semana",
      time: "Ontem",
      iconBg: "bg-[#0047BB]/10",
      iconColor: "#0047BB",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-12">
            {/* Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0047BB]/10">
                <GraduationCap className="w-4 h-4 text-[#0047BB]" />
                <span className="text-sm text-[#0047BB]">
                  Plataforma SENAI 2025
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-normal text-foreground mb-4">
              Gerador de Cursos SCORM SENAI
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
              Crie, gerencie e publique cursos SCORM compatíveis com as
              principais plataformas LMS. Produza conteúdo educacional
              padronizado, interoperável e de alta qualidade.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => router.push("/cursos/novo")}
                className="bg-[#0047BB] hover:bg-[#0047BB]/90 text-white h-10 px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Curso
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/cursos")}
                className="h-10 px-6 border-border"
              >
                Ver Todos os Cursos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Why Use Section */}
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-xl font-medium text-foreground mb-2">
                Por que usar nossa plataforma?
              </h2>
              <p className="text-base text-muted-foreground">
                Ferramentas poderosas para criar conteúdo e-learning padronizado
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="border border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-10">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-lg ${feature.iconBg} flex items-center justify-center`}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: feature.iconColor }}
                          />
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                          <h3 className="text-base font-normal text-foreground">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* CTA Card */}
          <Card className="mb-12 border border-[#0047BB]/20 bg-gradient-to-br from-[#0047BB]/5 to-[#F15A29]/5">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-medium text-foreground mb-2">
                    Pronto para começar?
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Comece criando seu primeiro curso SCORM ou explore os
                    pacotes existentes para ver tudo que a plataforma oferece.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push("/cursos/novo")}
                    className="bg-[#F15A29] hover:bg-[#F15A29]/90 text-white h-10 px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Curso
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/cursos")}
                    className="h-10 px-6 border-border"
                  >
                    Explorar Cursos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Section */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Atividade Recente
              </h3>
              <p className="text-sm text-muted-foreground">
                Últimas atualizações na plataforma
              </p>
            </div>

            {/* Activity Cards */}
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <Card
                    key={index}
                    className="border border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-full ${activity.iconBg} flex items-center justify-center shrink-0`}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: activity.iconColor }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-baseline gap-1">
                              <span className="text-base font-normal text-foreground">
                                {activity.title}
                              </span>
                              {activity.subtitle && (
                                <span className="text-base font-normal text-foreground">
                                  {activity.subtitle}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
