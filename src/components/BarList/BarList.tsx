import styles from './BarList.module.scss'

export type BarListItem = {
  id: string
  label: string
  value: number
  valueLabel: string
  isHighlighted?: boolean
}

type BarListProps = {
  items: BarListItem[]
  ariaLabel: string
}

export const BarList = ({ items, ariaLabel }: BarListProps) => {
  const maxValue = Math.max(...items.map((item) => item.value), 0)

  return (
    <ul className={styles.list} aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.track} aria-hidden="true">
            <span
              className={`${styles.fill} ${item.isHighlighted ? styles.highlighted : ''}`}
              style={{ inlineSize: maxValue === 0 ? '0%' : `${(item.value / maxValue) * 100}%` }}
            />
          </span>
          <span className={styles.value}>{item.valueLabel}</span>
        </li>
      ))}
    </ul>
  )
}
