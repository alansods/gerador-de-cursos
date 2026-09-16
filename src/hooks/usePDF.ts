'use client'

import { useState } from 'react'
import type { generateCoursePDF as GenerateCoursePDF } from '@/lib/pdf-service'

export const usePDF = () => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async (
    course: Parameters<typeof GenerateCoursePDF>[0],
    filename?: string
  ) => {
    setIsGenerating(true)
    try {
      const { generateCoursePDF } = await import('@/lib/pdf-service')
      await generateCoursePDF(course, filename)
    } catch (error) {
      console.error('PDF generation failed:', error)
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
