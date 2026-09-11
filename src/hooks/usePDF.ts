'use client'

import { useState } from 'react'
import { generateCoursePDF } from '@/lib/pdf-service'

export const usePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async (
    course: Parameters<typeof generateCoursePDF>[0],
    filename?: string
  ) => {
    setIsGenerating(true)
    try {
      await generateCoursePDF(course, filename)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.')
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generatePDF,
    isGenerating,
  }
}
