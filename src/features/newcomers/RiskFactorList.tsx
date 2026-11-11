import type { RiskFactor } from '@shared/risk.ts'
import styles from './RiskFactorList.module.scss'

type RiskFactorListProps = {
  factors: RiskFactor[]
  variant?: 'compact' | 'detailed'
  limit?: number
}

export const RiskFactorList = ({ factors, variant = 'compact', limit }: RiskFactorListProps) => {
  if (factors.length === 0) {
    return <p className={styles.empty}>Сигналов риска нет</p>
  }

  const visibleFactors = limit ? factors.slice(0, limit) : factors
  const hiddenCount = factors.length - visibleFactors.length

  return (
    <ul className={`${styles.list} ${styles[variant]}`}>
      {visibleFactors.map((factor, index) => (
        <li key={`${factor.code}-${index}`} className={styles.factor}>
          <span className={styles.label}>
            {factor.label}
            {variant === 'detailed' && <span className={styles.points}>+{factor.points}</span>}
          </span>
          {variant === 'detailed' && <span className={styles.action}>{factor.action}</span>}
        </li>
      ))}
      {hiddenCount > 0 && <li className={styles.more}>и ещё {hiddenCount}</li>}
    </ul>
  )
}
