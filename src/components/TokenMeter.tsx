'use client'

import { Zap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
}

interface TokenMeterProps {
  isLoading?: boolean
  extractedChars?: number
  totalDocChars?: number
  estimatedPromptTokens?: number
  actualUsage?: TokenUsage
  isGenerating?: boolean
}

// Limite do modelo Gemini Flash (1M tokens input)
const MODEL_INPUT_LIMIT = 1_048_576

function formatNumber(n: number) {
  return n.toLocaleString('pt-BR')
}

export function TokenMeter({
  isLoading,
  extractedChars,
  totalDocChars,
  estimatedPromptTokens,
  actualUsage,
  isGenerating,
}: TokenMeterProps) {
  const hasEstimate = extractedChars !== undefined && totalDocChars !== undefined && estimatedPromptTokens !== undefined

  const isTruncated = hasEstimate && totalDocChars! > 12_000
  const usedTokens = actualUsage ? actualUsage.totalTokens : (hasEstimate ? estimatedPromptTokens! : 0)
  const remainingTokens = MODEL_INPUT_LIMIT - usedTokens
  const usagePercent = Math.min((usedTokens / MODEL_INPUT_LIMIT) * 100, 100)

  const barColor =
    usagePercent < 50
      ? 'bg-green-500'
      : usagePercent < 80
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
        <span className="font-medium">Capacidade de Tokens da IA</span>
        {(isLoading || (isGenerating && !actualUsage)) && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        )}
        {actualUsage && (
          <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
        )}
      </div>

      {/* Barra de uso — sempre visível */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{hasEstimate || actualUsage ? 'Consumo estimado por geração' : 'Capacidade por geração'}</span>
          <span>{usagePercent < 0.01 && (hasEstimate || actualUsage) ? '< 0,01' : usagePercent > 0 ? usagePercent.toFixed(2) : '0'}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${usagePercent === 0 ? 'bg-green-500/20' : barColor}`}
            style={{ width: usagePercent === 0 ? '100%' : `${Math.max(usagePercent, 0.5)}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1 text-xs pt-0.5">
          <div>
            <p className="text-muted-foreground">Usado</p>
            <p className="font-mono font-medium">{hasEstimate || actualUsage ? `~${formatNumber(usedTokens)}` : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Restante</p>
            <p className={`font-mono font-medium ${hasEstimate || actualUsage ? 'text-green-600 dark:text-green-400' : ''}`}>
              {hasEstimate || actualUsage ? formatNumber(remainingTokens) : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-mono font-medium">{formatNumber(MODEL_INPUT_LIMIT)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70">
          Limite de contexto por requisição — Gemini Flash
        </p>
      </div>

      {/* Analisando documento */}
      {isLoading && !hasEstimate && (
        <p className="text-xs text-muted-foreground">Analisando documento...</p>
      )}

      {/* Detalhes da estimativa */}
      {hasEstimate && (
        <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-border">
          <div>
            <p className="text-muted-foreground mb-0.5">Caracteres enviados à IA</p>
            <p className="font-mono font-medium">{formatNumber(extractedChars!)}</p>
            {isTruncated && (
              <div className="flex items-center gap-1 mt-0.5 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>truncado ({formatNumber(totalDocChars!)} no total)</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Tokens estimados (entrada)</p>
            <p className="font-mono font-medium">~{formatNumber(estimatedPromptTokens!)}</p>
          </div>
        </div>
      )}

      {/* Uso real após geração */}
      {actualUsage && (
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            Uso real — geração concluída
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Entrada</p>
              <p className="font-mono font-medium">{formatNumber(actualUsage.promptTokens)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saída</p>
              <p className="font-mono font-medium">{formatNumber(actualUsage.completionTokens)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-mono font-semibold">{formatNumber(actualUsage.totalTokens)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Modelo: {actualUsage.model}</p>
        </div>
      )}
    </div>
  )
}
