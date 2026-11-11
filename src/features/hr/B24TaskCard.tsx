import type { ReactNode } from 'react'
import type { B24TaskDto } from '@shared/api.ts'
import { DAY_FORMS, formatCount } from '@shared/text.ts'
import { Badge } from '@/components/Badge/Badge.tsx'
import { Button } from '@/components/Button/Button.tsx'
import { formatDate, formatDateTime } from '@/lib/format.ts'
import styles from './B24TaskCard.module.scss'

type TaskDetail = {
  label: string
  value: ReactNode
}

const getTaskDetails = (task: B24TaskDto): TaskDetail[] => {
  if (task.type === 'hire') {
    return [
      { label: 'Должность', value: task.payload.position },
      { label: 'Подразделение', value: task.departmentName },
      { label: 'Место работы', value: task.locationName },
      { label: 'Руководитель', value: task.managerName },
      { label: 'Выход', value: formatDate(task.payload.startDate) },
    ]
  }

  return [
    { label: 'Дата увольнения', value: formatDate(task.payload.leaveDate) },
    { label: 'Причина', value: task.payload.reason },
    { label: 'Проработано', value: task.daysWorked === null ? '—' : formatCount(task.daysWorked, DAY_FORMS) },
  ]
}

const TASK_TYPE_LABELS: Record<B24TaskDto['type'], string> = {
  hire: 'Приём',
  dismiss: 'Увольнение',
}

const ACTION_LABELS: Record<B24TaskDto['type'], string> = {
  hire: 'Завести в «Первые 90»',
  dismiss: 'Учесть увольнение',
}

type B24TaskCardProps = {
  task: B24TaskDto
  isProcessing: boolean
  isDisabled: boolean
  onProcess: (taskId: number) => void
}

export const B24TaskCard = ({ task, isProcessing, isDisabled, onProcess }: B24TaskCardProps) => {
  const handleProcess = () => onProcess(task.id)

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.meta}>
            {task.externalId} · создана {formatDateTime(task.createdAt)}
          </span>
          <h3 className={styles.title}>{task.payload.fullName}</h3>
        </div>
        <Badge tone={task.type === 'hire' ? 'info' : 'warning'}>{TASK_TYPE_LABELS[task.type]}</Badge>
      </header>
      <dl className={styles.details}>
        {getTaskDetails(task).map((detail) => (
          <div key={detail.label} className={styles.detail}>
            <dt>{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <Button onClick={handleProcess} isLoading={isProcessing} disabled={isDisabled}>
          {ACTION_LABELS[task.type]}
        </Button>
      </div>
    </article>
  )
}
