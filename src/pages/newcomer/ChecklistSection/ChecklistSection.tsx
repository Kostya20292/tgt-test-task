import type { ChangeEvent } from 'react'
import { STAGE_LABELS, type Stage } from '@shared/timeline.ts'
import { getErrorMessage } from '@/api/client.ts'
import { useToggleChecklistItem } from '@/api/hooks.ts'
import { Badge } from '@/components/Badge/Badge.tsx'
import { Card } from '@/components/Card/Card.tsx'
import { ProgressBar } from '@/components/ProgressBar/ProgressBar.tsx'
import type { ChecklistItemRowProps, ChecklistSectionProps } from './ChecklistSection.types.ts'
import styles from './ChecklistSection.module.scss'

const STAGE_ORDER: Stage[] = ['first_week', 'first_month', 'probation']

const ChecklistItemRow = ({ item, dayNumber, isDisabled, onToggle }: ChecklistItemRowProps) => {
  const isOverdue = !item.doneAt && item.dueDay < dayNumber

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onToggle(item.id, event.target.checked)
  }

  return (
    <li>
      <label className={`${styles.item} ${item.doneAt ? styles.done : ''}`}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={Boolean(item.doneAt)}
          onChange={handleChange}
          disabled={isDisabled}
        />
        <span className={styles.itemText}>
          <span className={styles.itemTitle}>{item.title}</span>
          <span className={styles.itemMeta}>
            Срок: {item.dueDay}-й день
            {isOverdue && <Badge tone="warning">Срок прошёл</Badge>}
          </span>
        </span>
      </label>
    </li>
  )
}

export const ChecklistSection = ({ page, token }: ChecklistSectionProps) => {
  const toggleMutation = useToggleChecklistItem(token)
  const doneCount = page.checklist.filter((item) => item.doneAt).length

  const handleToggle = (itemId: number, done: boolean) => {
    toggleMutation.mutate({ itemId, done })
  }

  return (
    <Card title="План адаптации" description="Отмечайте, что уже сделано — руководитель видит прогресс.">
      <ProgressBar
        label="Выполнено"
        value={doneCount}
        max={page.checklist.length}
        valueText={`${doneCount} из ${page.checklist.length}`}
      />
      {toggleMutation.isError && (
        <p className={styles.error} role="alert">
          {getErrorMessage(toggleMutation.error)}
        </p>
      )}
      {STAGE_ORDER.map((stage) => {
        const items = page.checklist.filter((item) => item.stage === stage)
        if (items.length === 0) return null

        return (
          <section key={stage} className={styles.stage} aria-label={STAGE_LABELS[stage]}>
            <h3>{STAGE_LABELS[stage]}</h3>
            <ul className={styles.list}>
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  dayNumber={page.dayNumber}
                  isDisabled={toggleMutation.isPending}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </Card>
  )
}
