import { useId } from 'react'
import styles from './ProgressBar.module.scss'

type ProgressBarProps = {
  label: string
  value: number
  max: number
  valueText?: string
}

export const ProgressBar = ({ label, value, max, valueText }: ProgressBarProps) => {
  const labelId = useId()
  const clampedValue = Math.min(Math.max(value, 0), max)

  return (
    <div className={styles.progress}>
      <div className={styles.labels}>
        <span id={labelId}>{label}</span>
        {valueText && <span className={styles.value}>{valueText}</span>}
      </div>
      <progress className={styles.bar} aria-labelledby={labelId} value={clampedValue} max={max}>
        {valueText}
      </progress>
    </div>
  )
}
