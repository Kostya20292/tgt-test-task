import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}
