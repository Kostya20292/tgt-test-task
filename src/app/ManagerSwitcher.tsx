import { SelectField } from '@/components/SelectField/SelectField.tsx'
import { useCurrentManager } from './managerSelection.ts'
import styles from './ManagerSwitcher.module.scss'

export const ManagerSwitcher = () => {
  const { manager, managers, selectManager, metaQuery } = useCurrentManager()
  const locations = metaQuery.data?.locations ?? []

  if (!manager) return null

  const options = managers.map((item) => ({
    value: String(item.id),
    label: `${item.fullName} — ${locations.find((location) => location.id === item.locationId)?.name ?? item.position} (${item.activeNewcomers})`,
  }))

  const handleManagerChange = (value: string) => {
    selectManager(Number(value))
  }

  return (
    <div className={styles.switcher}>
      <span className={styles.caption} aria-hidden="true">
        Вы смотрите как
      </span>
      <SelectField
        label="Вы смотрите как руководитель"
        isLabelHidden
        value={String(manager.id)}
        options={options}
        onChange={handleManagerChange}
      />
    </div>
  )
}
