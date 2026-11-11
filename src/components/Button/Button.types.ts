import type { ButtonHTMLAttributes } from 'react'
import type { ButtonSize, ButtonVariant } from './buttonClassName.ts'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}
