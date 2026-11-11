import { Badge } from '@/components/Badge/Badge.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar.tsx';
import type { ChecklistProgressCardProps } from './ChecklistProgressCard.types.ts';
import styles from './ChecklistProgressCard.module.scss';

export const ChecklistProgressCard = ({ newcomer }: ChecklistProgressCardProps) => {
  const doneCount = newcomer.checklist.filter((item) => item.doneAt).length;

  return (
    <Card title="План адаптации" description="Отмечает сам новичок на своей странице.">
      <ProgressBar
        label="Выполнено"
        value={doneCount}
        max={newcomer.checklist.length}
        valueText={`${doneCount} из ${newcomer.checklist.length}`}
      />
      <ul className={styles.list}>
        {newcomer.checklist.map((item) => {
          const isOverdue = !item.doneAt && item.dueDay < newcomer.dayNumber;
          return (
            <li key={item.id} className={`${styles.item} ${item.doneAt ? styles.done : ''}`}>
              <span className={styles.mark} aria-hidden="true">
                {item.doneAt ? '✓' : ''}
              </span>
              <span className={styles.title}>
                <span className="visually-hidden">
                  {item.doneAt ? 'Выполнено: ' : 'Не выполнено: '}
                </span>
                {item.title}
              </span>
              <span className={styles.due}>
                {item.dueDay}-й день
                {isOverdue && <Badge tone="warning">Срок прошёл</Badge>}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};
