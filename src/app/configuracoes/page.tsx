"use client";

// Esta página não deve ser exportada estaticamente
export const dynamic = "error";

import { PageTransition } from "@/components/PageTransition";
import { Construction, Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Construction className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                Configurações
              </h1>
            </div>
            <p className="text-xl font-semibold text-foreground mb-2">
              Página em Construção
            </p>
            <p className="text-muted-foreground">
              Esta funcionalidade está sendo desenvolvida e estará disponível em
              breve.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
