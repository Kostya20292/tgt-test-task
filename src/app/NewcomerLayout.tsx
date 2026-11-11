import { Link, Outlet } from 'react-router'
import styles from './NewcomerLayout.module.scss'

export const NewcomerLayout = () => (
  <>
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            90
          </span>
          Первые 90
        </span>
        <Link to="/" className={styles.demoLink}>
          Демо: сменить роль
        </Link>
      </div>
    </header>
    <main id="main" className={styles.main}>
      <Outlet />
    </main>
  </>
)
