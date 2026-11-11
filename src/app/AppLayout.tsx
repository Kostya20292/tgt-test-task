import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { DemoFooter } from './DemoFooter.tsx'
import { HrNavigation } from './HrNavigation.tsx'
import { ManagerSwitcher } from './ManagerSwitcher.tsx'
import styles from './AppLayout.module.scss'

type Section = 'hr' | 'manager' | null

const getSection = (pathname: string): Section => {
  if (pathname.startsWith('/hr')) return 'hr'
  if (pathname.startsWith('/manager')) return 'manager'
  return null
}

const getRoleLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  [styles.roleLink, isActive ? styles.roleLinkActive : ''].join(' ')

export const AppLayout = () => {
  const { pathname } = useLocation()
  const section = getSection(pathname)

  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Перейти к содержимому
      </a>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <Link to="/" className={styles.brand} aria-label="Первые 90 — на главную">
            <span className={styles.logo} aria-hidden="true">
              90
            </span>
            <span className={styles.brandText}>Первые 90</span>
          </Link>
          <nav aria-label="Выбор роли" className={styles.roleNav}>
            <NavLink to="/hr" className={getRoleLinkClassName}>
              HR
            </NavLink>
            <NavLink to="/manager" className={getRoleLinkClassName}>
              Руководитель
            </NavLink>
          </nav>
        </div>
        {section && (
          <div className={styles.sectionRow}>
            {section === 'hr' ? <HrNavigation /> : <ManagerSwitcher />}
          </div>
        )}
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <DemoFooter />
    </>
  )
}
