import { getButtonClassName } from './buttonClassName.ts';
import type { ButtonProps } from './Button.types.ts';
import styles from './Button.module.scss';

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
);
