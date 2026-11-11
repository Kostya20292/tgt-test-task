import type { ButtonSize, ButtonVariant } from '../Button/buttonClassName.ts'

export type ConfirmDialogProps = {
  triggerLabel: string
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  isPending?: boolean
  triggerVariant?: ButtonVariant
  triggerSize?: ButtonSize
}
