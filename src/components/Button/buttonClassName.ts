import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'm' | 's'

export const getButtonClassName = (variant: ButtonVariant = 'primary', size: ButtonSize = 'm'): string =>
  [styles.button, styles[variant], styles[size]].join(' ')
