'use client'

import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ReactNode } from 'react'

interface TooltipButtonProps {
  icon: LucideIcon
  tooltip: string | ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  variant?: 'ghost' | 'outline' | 'destructive' | 'default'
  size?: 'sm' | 'md' | 'lg'
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconClassName?: string
  tooltipClassName?: string
  disabled?: boolean
  asButton?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6 p-0',
  md: 'h-8 w-8 p-0',
  lg: 'h-10 w-10 p-0',
}

const iconSizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
}

export function TooltipButton({
  icon: Icon,
  tooltip,
  onClick,
  variant = 'ghost',
  size = 'lg',
  tooltipSide = 'bottom',
  className = '',
  iconClassName = '',
  tooltipClassName = '',
  disabled = false,
  asButton = true,
}: TooltipButtonProps) {
  const buttonContent = <Icon className={iconClassName || iconSizeClasses[size]} />

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {asButton ? (
            <Button
              variant={variant}
              size="default"
              onClick={onClick}
              disabled={disabled}
              className={`${sizeClasses[size]} ${className}`}
            >
              {buttonContent}
            </Button>
          ) : (
            <button onClick={onClick} disabled={disabled} className={className}>
              {buttonContent}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} className={tooltipClassName}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
