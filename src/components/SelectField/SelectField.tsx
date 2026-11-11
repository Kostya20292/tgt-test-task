import { useId, type ChangeEvent } from 'react'
import styles from './SelectField.module.scss'

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  isLabelHidden?: boolean
  disabled?: boolean
}

export const SelectField = ({ label, value, options, onChange, isLabelHidden = false, disabled }: SelectFieldProps) => {
  const selectId = useId()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={styles.field}>
      <label htmlFor={selectId} className={isLabelHidden ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <select id={selectId} className={styles.select} value={value} onChange={handleChange} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
