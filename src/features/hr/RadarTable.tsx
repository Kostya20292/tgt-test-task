import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { NewcomerListItemDto } from '@shared/api.ts'
import { STAGE_LABELS } from '@shared/timeline.ts'
import { CheckpointStatusBadge } from '@/components/CheckpointStatusBadge/CheckpointStatusBadge.tsx'
import { RiskBadge } from '@/components/RiskBadge/RiskBadge.tsx'
import { RiskFactorList } from '@/features/newcomers/RiskFactorList.tsx'
import { formatDate, formatDayProgress } from '@/lib/format.ts'
import styles from './RadarTable.module.scss'

const COLUMN_LABELS = {
  newcomer: 'Новичок',
  day: 'Срок',
  risk: 'Риск и причины',
  meeting: 'Ближайшая встреча',
} as const

type CellProps = {
  label: string
  className?: string
  children: ReactNode
}

const Cell = ({ label, className, children }: CellProps) => (
  <td data-label={label} className={className}>
    <div className={styles.cell}>{children}</div>
  </td>
)

type RadarRowProps = {
  newcomer: NewcomerListItemDto
}

const RadarRow = ({ newcomer }: RadarRowProps) => (
  <tr className={styles[newcomer.risk.level]}>
    <th scope="row">
      <div className={styles.cell}>
        <Link to={`/hr/newcomers/${newcomer.id}`} className={styles.name}>
          {newcomer.fullName}
        </Link>
        <span className={styles.secondary}>
          {newcomer.position} · {newcomer.location.name}
        </span>
        <span className={styles.secondary}>Руководитель: {newcomer.manager.fullName}</span>
      </div>
    </th>
    <Cell label={COLUMN_LABELS.day}>
      <span className={styles.nowrap}>{formatDayProgress(newcomer.dayNumber)}</span>
      <span className={styles.secondary}>{STAGE_LABELS[newcomer.stage]}</span>
    </Cell>
    <Cell label={COLUMN_LABELS.risk} className={styles.riskCell}>
      <RiskBadge level={newcomer.risk.level} score={newcomer.risk.score} />
      <RiskFactorList factors={newcomer.risk.factors} limit={2} />
    </Cell>
    <Cell label={COLUMN_LABELS.meeting}>
      {newcomer.nextCheckpoint ? (
        <>
          <span className={styles.nowrap}>{formatDate(newcomer.nextCheckpoint.dueDate)}</span>
          <CheckpointStatusBadge status={newcomer.nextCheckpoint.status} />
        </>
      ) : (
        <span className={styles.secondary}>Все встречи проведены</span>
      )}
    </Cell>
  </tr>
)

type RadarTableProps = {
  newcomers: NewcomerListItemDto[]
}

export const RadarTable = ({ newcomers }: RadarTableProps) => (
  <div className={styles.container}>
    <div className={styles.scroller} role="region" aria-labelledby="radar-caption" tabIndex={0}>
      <table className={styles.table}>
        <caption id="radar-caption" className="visually-hidden">
          Новички в первых 90 днях, отсортированы по риску
        </caption>
        <thead>
          <tr>
            {Object.values(COLUMN_LABELS).map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {newcomers.map((newcomer) => (
            <RadarRow key={newcomer.id} newcomer={newcomer} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
)
