import type { ButtonHTMLAttributes } from 'react'
import { getButtonClassName, type ButtonSize, type ButtonVariant } from './buttonClassName.ts'
import styles from './Button.module.scss'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

export const Button = ({
  variant = 'primary',
  size = 'm',
  isLoading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={[getButtonClassName(variant, size), className].filter(Boolean).join(' ')}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    {...rest}
  >
    {isLoading && <span className={styles.spinner} aria-hidden="true" />}
    {children}
  </button>
)
