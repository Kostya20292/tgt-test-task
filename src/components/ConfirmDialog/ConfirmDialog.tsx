import { useId, useRef, type SyntheticEvent } from 'react'
import { Button } from '../Button/Button.tsx'
import type { ButtonSize, ButtonVariant } from '../Button/buttonClassName.ts'
import styles from './ConfirmDialog.module.scss'

const CONFIRM_VALUE = 'confirm'

type ConfirmDialogProps = {
  triggerLabel: string
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  isPending?: boolean
  triggerVariant?: ButtonVariant
  triggerSize?: ButtonSize
}

export const ConfirmDialog = ({
  triggerLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending = false,
  triggerVariant = 'secondary',
  triggerSize = 's',
}: ConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const handleOpen = () => {
    dialogRef.current?.showModal()
  }

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    const dialog = event.currentTarget
    const shouldConfirm = dialog.returnValue === CONFIRM_VALUE
    dialog.returnValue = ''
    if (shouldConfirm) onConfirm()
  }

  return (
    <>
      <Button variant={triggerVariant} size={triggerSize} onClick={handleOpen} isLoading={isPending}>
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={handleClose}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
        <form method="dialog" className={styles.actions}>
          <Button type="submit" variant="secondary" value="cancel" autoFocus>
            Отмена
          </Button>
          <Button type="submit" variant="danger" value={CONFIRM_VALUE}>
            {confirmLabel}
          </Button>
        </form>
      </dialog>
    </>
  )
}
