'use client'

import { ReactNode, useState, useEffect, useRef } from 'react'
import { Info, TriangleAlert, Lightbulb, ChevronDown } from 'lucide-react'

interface InfoBoxProps {
  tipo: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade'
  titulo?: string
  children: ReactNode
  className?: string
}

const variantMap = {
  atencao: 'warn',
  saiba_mais: 'info',
  info: 'info',
  curiosidade: 'recap',
} as const

const iconMap = {
  atencao: TriangleAlert,
  saiba_mais: Info,
  info: Info,
  curiosidade: Lightbulb,
}

const tagMap = {
  atencao: 'Atenção',
  saiba_mais: 'Saiba mais',
  info: 'Informação',
  curiosidade: 'Curiosidade',
}

export function InfoBox({ tipo, titulo, children, className = '' }: InfoBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)
  const infoboxRef = useRef<HTMLDivElement>(null)

  const variant = variantMap[tipo]
  const Icon = iconMap[tipo]
  const tag = tagMap[tipo]
  const isCollapsible = Boolean(titulo)

  useEffect(() => {
    if (!infoboxRef.current) return

    const ibObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setHasAppeared(true)
            ibObs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.25 }
    )

    const el = infoboxRef.current

    // Find index among all infoboxes on page for stagger
    const allInfoboxes = document.querySelectorAll('.infobox')
    const index = Array.from(allInfoboxes).indexOf(el)

    if (index !== -1) {
      el.style.transitionDelay = (index % 3) * 90 + 'ms'
    }

    ibObs.observe(el)

    return () => {
      ibObs.disconnect()
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const classNames = [
    'infobox',
    variant,
    isCollapsible && 'collapsible',
    isCollapsible && isOpen && 'open',
    hasAppeared && 'in-view',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={infoboxRef} className={classNames} onClick={isCollapsible ? handleToggle : undefined}>
      <span className="infobox-icon">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <div className="infobox-body">
        <span className="infobox-tag">{tag}</span>
        {isCollapsible ? (
          <>
            <div className="infobox-head">
              <h4>{titulo}</h4>
              <span className="infobox-chev">
                <ChevronDown />
              </span>
            </div>
            <div className="infobox-content">
              <div>{children}</div>
            </div>
          </>
        ) : (
          <>{children}</>
        )}
      </div>
    </div>
  )
}
