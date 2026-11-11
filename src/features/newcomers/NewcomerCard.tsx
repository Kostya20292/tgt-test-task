import { Link } from 'react-router'
import type { NewcomerListItemDto } from '@shared/api.ts'
import { STAGE_LABELS } from '@shared/timeline.ts'
import { CheckpointStatusBadge } from '@/components/CheckpointStatusBadge/CheckpointStatusBadge.tsx'
import { RiskBadge } from '@/components/RiskBadge/RiskBadge.tsx'
import { formatDate, formatDayProgress } from '@/lib/format.ts'
import { RiskFactorList } from './RiskFactorList.tsx'
import styles from './NewcomerCard.module.scss'

type NewcomerCardProps = {
  newcomer: NewcomerListItemDto
  href: string
}

export const NewcomerCard = ({ newcomer, href }: NewcomerCardProps) => (
  <article className={`${styles.card} ${styles[newcomer.risk.level]}`}>
    <header className={styles.header}>
      <div className={styles.identity}>
        <h3 className={styles.name}>
          <Link to={href} className={styles.link}>
            {newcomer.fullName}
          </Link>
        </h3>
        <p className={styles.meta}>
          {newcomer.position} · {formatDayProgress(newcomer.dayNumber)} · {STAGE_LABELS[newcomer.stage]}
        </p>
      </div>
      <RiskBadge level={newcomer.risk.level} score={newcomer.risk.score} />
    </header>
    <RiskFactorList factors={newcomer.risk.factors} limit={3} />
    {newcomer.nextCheckpoint && (
      <p className={styles.meeting}>
        <span>
          Встреча «{newcomer.nextCheckpoint.title}» — {formatDate(newcomer.nextCheckpoint.dueDate)}
        </span>
        <CheckpointStatusBadge status={newcomer.nextCheckpoint.status} />
      </p>
    )}
  </article>
)
