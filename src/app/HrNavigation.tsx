import { NavLink } from 'react-router'
import { useB24Tasks } from '@/api/hooks.ts'
import styles from './HrNavigation.module.scss'

const getLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  [styles.link, isActive ? styles.active : ''].join(' ')

export const HrNavigation = () => {
  const { data } = useB24Tasks()
  const pendingCount = data?.pending.length ?? 0

  return (
    <nav aria-label="Разделы HR" className={styles.nav}>
      <NavLink to="/hr" end className={getLinkClassName}>
        Радар
      </NavLink>
      <NavLink to="/hr/b24" className={getLinkClassName}>
        Задачи Б24
        {pendingCount > 0 && (
          <span className={styles.counter}>
            {pendingCount}
            <span className="visually-hidden"> новых</span>
          </span>
        )}
      </NavLink>
      <NavLink to="/hr/metrics" className={getLinkClassName}>
        Метрики
      </NavLink>
    </nav>
  )
}
