import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, GraduationCap, Layers, ArrowRight } from "lucide-react";
import type { CursoGerado } from "@/types/gerador-curso";
import { SCORMPlayer } from "@/components/scorm/SCORMPlayer";
import fs from "fs/promises";

// Forçar geração estática completa (sem RSC fetches)
export const dynamic = "force-static";

// Função para carregar dados do curso durante o build
async function getCursoData(): Promise<CursoGerado | null> {
  if (process.env.SCORM_BUILD_CURSO_FILE) {
    try {
      const cursoFile = process.env.SCORM_BUILD_CURSO_FILE;
      const cursoData = await fs.readFile(cursoFile, "utf-8");
      return JSON.parse(cursoData) as CursoGerado;
    } catch (error) {
      console.error("[scorm-preview] Erro ao carregar curso:", error);
    }
  }
  return null;
}

export default async function SCORMPreviewPage() {
  const curso = await getCursoData();

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Curso não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O curso não foi fornecido ou houve um erro ao carregá-lo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SCORMPlayer curso={curso} />
  );
}
