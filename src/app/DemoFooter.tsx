import { useLocation, useNavigate } from 'react-router'
import { getErrorMessage } from '@/api/client.ts'
import { useResetDemo } from '@/api/hooks.ts'
import { ConfirmDialog } from '@/components/ConfirmDialog/ConfirmDialog.tsx'
import styles from './DemoFooter.module.scss'

const DETAIL_PATH_PATTERN = /^\/(hr|manager)\/newcomers\//

export const DemoFooter = () => {
  const resetMutation = useResetDemo()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        const section = DETAIL_PATH_PATTERN.exec(pathname)?.[1]
        if (section) void navigate(`/${section}`)
      },
    })
  }

  const statusMessage = resetMutation.isSuccess
    ? 'Демо-данные сброшены к исходному состоянию.'
    : resetMutation.isError
      ? `Не удалось сбросить данные: ${getErrorMessage(resetMutation.error)}`
      : ''

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.note}>
          Демо-версия. Все люди и данные вымышлены. Битрикс24 имитируется.
        </p>
        <div className={styles.actions}>
          <p className={styles.status} role="status">
            {statusMessage}
          </p>
          <ConfirmDialog
            triggerLabel="Сбросить демо-данные"
            title="Сбросить демо-данные?"
            description="Все изменения (чек-ины, отметки, принятые задачи) удалятся, данные вернутся к исходному состоянию."
            confirmLabel="Сбросить"
            onConfirm={handleReset}
            isPending={resetMutation.isPending}
          />
        </div>
      </div>
    </footer>
  )
}
