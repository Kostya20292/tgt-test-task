import { Link } from 'react-router'
import { EmptyState } from '@/components/StateViews/StateViews.tsx'

export const NotFoundPage = () => (
  <>
    <title>Страница не найдена — Первые 90</title>
    <EmptyState title="Страница не найдена">
      <p>
        Проверьте адрес или вернитесь <Link to="/">на главную</Link>.
      </p>
    </EmptyState>
  </>
)
