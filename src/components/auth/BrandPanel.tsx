'use client'

import { FileText, Layout, Package } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface FeatureProps {
  icon: React.ReactNode
  title: string
  description: string
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-[10px] bg-white/16 backdrop-blur-[8px] flex items-center justify-center flex-shrink-0 text-white">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
        <p className="text-[13px] leading-relaxed text-white/75">{description}</p>
      </div>
    </div>
  )
}

export function BrandPanel() {
  const t = useTranslations('auth.brandPanel')

  return (
    <aside className="brand-panel">
      <div className="brand-center">
        <span className="brand-kicker">
          <span className="dot" />
          {t('kicker')}
        </span>
        <h2 className="text-[38px] leading-tight font-medium tracking-tight mb-4">{t('title')}</h2>
        <p className="text-base leading-relaxed text-white/85 mb-8 max-w-[42ch]">
          {t('description')}
        </p>

        <div className="brand-features">
          <Feature
            icon={<FileText className="w-[18px] h-[18px]" strokeWidth={2} />}
            title={t('feature1Title')}
            description={t('feature1Description')}
          />
          <Feature
            icon={<Layout className="w-[18px] h-[18px]" strokeWidth={2} />}
            title={t('feature2Title')}
            description={t('feature2Description')}
          />
          <Feature
            icon={<Package className="w-[18px] h-[18px]" strokeWidth={2} />}
            title={t('feature3Title')}
            description={t('feature3Description')}
          />
        </div>
      </div>

      <style jsx>{`
        .brand-panel {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(900px 500px at 85% 15%, rgba(253, 151, 43, 0.28), transparent 60%),
            radial-gradient(900px 600px at 0% 100%, rgba(0, 144, 255, 0.22), transparent 55%),
            linear-gradient(135deg, #002c74 0%, #0047bb 55%, #0067e2 100%);
          color: #fff;
          padding: 56px 56px 48px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        :global(.dark) .brand-panel {
          background: var(--neutral-900);
        }

        .brand-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.6), transparent 75%);
        }

        :global(.dark) .brand-panel::after {
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }

        .brand-panel > * {
          position: relative;
          z-index: 1;
        }

        .brand-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 480px;
          padding: 48px 0;
        }

        .brand-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          font-weight: 500;
        }

        .brand-kicker .dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #f15a29;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (max-width: 980px) {
          .brand-panel {
            display: none;
          }
        }
      `}</style>
    </aside>
  )
}
