import type { FaqItem } from '@shared/faq.ts'
import { Card } from '@/components/Card/Card.tsx'
import styles from './FaqSection.module.scss'

type FaqSectionProps = {
  items: FaqItem[]
}

export const FaqSection = ({ items }: FaqSectionProps) => (
  <Card title="Частые вопросы">
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.question} className={styles.item} name="faq">
          <summary className={styles.question}>{item.question}</summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  </Card>
)
