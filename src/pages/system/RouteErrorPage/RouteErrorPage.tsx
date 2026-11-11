import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import styles from './RouteErrorPage.module.scss'

export const RouteErrorPage = () => {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Произошла непредвиденная ошибка. Обновите страницу.'

  return (
    <main className={styles.page}>
      <title>Ошибка — Первые 90</title>
      <h1>Что-то пошло не так</h1>
      <p>{message}</p>
      <Link to="/">Вернуться на главную</Link>
    </main>
  )
}
