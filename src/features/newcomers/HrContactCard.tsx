import { useState } from 'react'
import { Link } from 'react-router'
import type { NewcomerDetailDto } from '@shared/api.ts'
import { getErrorMessage } from '@/api/client.ts'
import { useMarkHrContact } from '@/api/hooks.ts'
import { Button } from '@/components/Button/Button.tsx'
import { Card } from '@/components/Card/Card.tsx'
import { formatDateTime } from '@/lib/format.ts'
import styles from './HrContactCard.module.scss'

type HrContactCardProps = {
  newcomer: NewcomerDetailDto
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const COPY_STATUS_TEXT: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Ссылка скопирована',
  failed: 'Не удалось скопировать — выделите ссылку вручную',
}

export const HrContactCard = ({ newcomer }: HrContactCardProps) => {
  const markMutation = useMarkHrContact(newcomer.id)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  const pagePath = newcomer.token ? `/n/${newcomer.token}` : null
  const pageUrl = pagePath ? `${window.location.origin}${pagePath}` : null
  const hasPendingRequest = newcomer.risk.factors.some((factor) => factor.code === 'wants_hr')

  const handleCopy = async () => {
    if (!pageUrl) return
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const handleMarkContact = () => {
    markMutation.mutate()
  }

  return (
    <Card title="Связь с новичком" tone={hasPendingRequest ? 'highlight' : 'default'}>
      {hasPendingRequest && (
        <div className={styles.request}>
          <p className={styles.requestText}>
            Новичок просит связаться с HR. Руководитель видит только «Есть сигнал для HR» — без подробностей.
          </p>
          <div>
            <Button onClick={handleMarkContact} isLoading={markMutation.isPending}>
              Отметить: HR связался
            </Button>
          </div>
          {markMutation.isError && (
            <p className={styles.error} role="alert">
              {getErrorMessage(markMutation.error)}
            </p>
          )}
        </div>
      )}

      {!hasPendingRequest && newcomer.hrContactedAt && (
        <p className={styles.muted}>HR связывался {formatDateTime(newcomer.hrContactedAt)}.</p>
      )}

      {pagePath && pageUrl && (
        <div className={styles.link}>
          <span className={styles.linkLabel}>Личная страница новичка (без логина)</span>
          <code className={styles.url}>{pageUrl}</code>
          <div className={styles.linkActions}>
            <Button variant="secondary" size="s" onClick={() => void handleCopy()}>
              Скопировать ссылку
            </Button>
            <Link to={pagePath} className={styles.open} target="_blank" rel="noopener">
              Открыть страницу
              <span className="visually-hidden"> (в новой вкладке)</span>
            </Link>
          </div>
          <p className={styles.copyStatus} role="status">
            {COPY_STATUS_TEXT[copyStatus]}
          </p>
        </div>
      )}
    </Card>
  )
}
