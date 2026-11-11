import { Link } from 'react-router'
import { STAGE_LABELS } from '@shared/timeline.ts'
import { useShowcase } from '@/api/hooks.ts'
import { getButtonClassName } from '@/components/Button/buttonClassName.ts'
import { formatDayProgress } from '@/lib/format.ts'
import styles from './HomePage.module.scss'

const STEPS = [
  {
    title: 'Задача «Приём» из Битрикс24',
    text: 'HR принимает задачу — новичок попадает в систему, получает личную ссылку, план адаптации и пять контрольных встреч с руководителем.',
  },
  {
    title: 'Новичок раз в неделю отвечает на 4 вопроса',
    text: 'Самочувствие, понятны ли задачи, хватает ли помощи и «хочу поговорить с HR» — меньше минуты с телефона.',
  },
  {
    title: 'Прозрачные правила считают риск',
    text: 'Плохой чек-ин, молчание, нет наставника, просроченная встреча — каждая причина видна текстом с подсказкой, что сделать.',
  },
  {
    title: 'Руководитель и HR действуют вовремя',
    text: 'Проводят встречу, назначают наставника, связываются с новичком — и видят, как снижается риск.',
  },
]

export const HomePage = () => {
  const showcaseQuery = useShowcase()

  return (
    <>
      <title>Первые 90 — адаптация новичков</title>
      <section className={styles.hero} aria-labelledby="home-title">
        <p className={styles.eyebrow}>Спорттовары · опт и розница · ~400 сотрудников</p>
        <h1 id="home-title">Первые 90 дней новичка — под присмотром, а не на удачу</h1>
        <p className={styles.lead}>
          Каждый третий из ушедших сотрудников не доработал до трёх месяцев. «Первые 90» помогает заметить, что
          новичку плохо, до заявления об уходе — и подсказывает руководителю и HR, что сделать прямо сейчас.
        </p>
      </section>

      <section aria-labelledby="roles-title" className={styles.section}>
        <h2 id="roles-title">Посмотрите глазами каждой роли</h2>
        <ul className={styles.roles}>
          <li className={styles.role}>
            <h3>HR</h3>
            <p>Радар всех новичков с причинами риска, входящие задачи Битрикс24 и метрики ранних уходов.</p>
            <Link to="/hr" className={getButtonClassName('primary')}>
              Открыть радар
            </Link>
          </li>
          <li className={styles.role}>
            <h3>Руководитель</h3>
            <p>Свои новички, просроченные встречи и подсказки, кому нужно внимание на этой неделе.</p>
            <Link to="/manager" className={getButtonClassName('primary')}>
              Мои новички
            </Link>
          </li>
          <li className={styles.role}>
            <h3>Новичок</h3>
            <p>Личная страница по ссылке без логина: план, контакты, ответы на частые вопросы и чек-ин.</p>
            {showcaseQuery.data && showcaseQuery.data.length > 0 ? (
              <ul className={styles.showcase} aria-label="Примеры страниц новичков">
                {showcaseQuery.data.map((newcomer) => (
                  <li key={newcomer.token}>
                    <Link to={`/n/${newcomer.token}`} className={styles.showcaseLink}>
                      <span className={styles.showcaseName}>{newcomer.fullName}</span>
                      <span className={styles.showcaseMeta}>
                        {newcomer.position} · {formatDayProgress(newcomer.dayNumber)} · {STAGE_LABELS[newcomer.stage]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                {showcaseQuery.isPending ? 'Загружаем примеры…' : 'Примеры появятся после загрузки демо-данных.'}
              </p>
            )}
          </li>
        </ul>
      </section>

      <section aria-labelledby="how-title" className={styles.section}>
        <h2 id="how-title">Как это работает</h2>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step.title} className={styles.step}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="try-title" className={styles.try}>
        <h2 id="try-title">Попробуйте за 2 минуты</h2>
        <ol className={styles.tryList}>
          <li>
            <Link to="/hr/b24">Задачи Б24</Link> → заведите новичка с выходом сегодня (Мария Попова).
          </li>
          <li>Откройте страницу новичка и пройдите чек-ин: самочувствие 2 и «Хочу поговорить с HR».</li>
          <li>
            Вернитесь на <Link to="/hr">радар</Link> — новичок поднялся наверх с причинами риска.
          </li>
          <li>
            Переключитесь на <Link to="/manager">руководителя</Link>: сигнал для HR виден, но без подробностей.
          </li>
          <li>
            В карточке новичка у HR отметьте «HR связался» — риск снижается. Загляните в{' '}
            <Link to="/hr/metrics">метрики</Link>.
          </li>
        </ol>
      </section>
    </>
  )
}
