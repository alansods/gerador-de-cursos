'use client'

import { useMemo } from 'react'

interface PasswordStrengthMeterProps {
  password: string
  onChange?: (score: number) => void
}

function calculateScore(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, 4)
}

function getStrengthLabel(score: number): string {
  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']
  return labels[score] || 'Muito fraca'
}

function getStrengthHint(password: string, score: number): string {
  if (score === 4) return 'Excelente! Sua senha é forte.'
  if (score === 3) return 'Adicione um símbolo para fortalecer'
  if (score === 2) return 'Adicione maiúsculas e números'
  if (password.length < 8) return 'Use no mínimo 8 caracteres'
  return 'Use maiúsculas, números e símbolos'
}

export function PasswordStrengthMeter({ password, onChange }: PasswordStrengthMeterProps) {
  const score = useMemo(() => {
    const newScore = calculateScore(password)
    if (onChange) {
      onChange(newScore)
    }
    return newScore
  }, [password, onChange])

  const strengthLabel = getStrengthLabel(score)
  const strengthHint = getStrengthHint(password, score)

  if (!password) return null

  return (
    <div className={`pw-meter level-${score}`}>
      <div className="pw-bars">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1 rounded-full transition-colors ${
              index < score
                ? score === 4
                  ? 'bg-green-600 dark:bg-green-500'
                  : score === 3
                    ? 'bg-yellow-500 dark:bg-yellow-400'
                    : 'bg-orange-500 dark:bg-orange-400'
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          />
        ))}
      </div>
      <p
        className={`pw-label mt-2 text-xs ${
          score === 4
            ? 'text-green-600 dark:text-green-500 font-medium'
            : 'text-neutral-600 dark:text-neutral-400'
        }`}
      >
        Força: <strong>{strengthLabel}</strong> — {strengthHint}
      </p>
    </div>
  )
}
