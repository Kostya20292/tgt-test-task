import { useSearchParams } from 'react-router'
import type { MetaDto, NewcomerListItemDto, Viewer } from '@shared/api.ts'
import { PERSON_FORMS, formatCount } from '@shared/text.ts'
import { useMeta, useNewcomers } from '@/api/hooks.ts'
import { PageHeader } from '@/components/PageHeader/PageHeader.tsx'
import { StatCard, StatGrid } from '@/components/StatCard/StatCard.tsx'
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx'
import { RadarFiltersBar } from './RadarFiltersBar.tsx'
import { RadarTable } from './RadarTable.tsx'
import {
  FILTER_PARAM_KEYS,
  applyRadarFilters,
  hasActiveFilters,
  readRadarFilters,
  type RadarFilters,
} from './radarFilters.ts'
import styles from './RadarPage.module.scss'

const HR_VIEWER: Viewer = { role: 'hr' }

type RadarSummaryProps = {
  newcomers: NewcomerListItemDto[]
}

const RadarSummary = ({ newcomers }: RadarSummaryProps) => {
  const highCount = newcomers.filter((newcomer) => newcomer.risk.level === 'high').length
  const mediumCount = newcomers.filter((newcomer) => newcomer.risk.level === 'medium').length
  const hrSignalCount = newcomers.filter((newcomer) =>
    newcomer.risk.factors.some((factor) => factor.code === 'wants_hr'),
  ).length
  const firstMonthCount = newcomers.filter((newcomer) => newcomer.dayNumber >= 1 && newcomer.dayNumber <= 30).length

  return (
    <StatGrid>
      <StatCard label="Новички в первых 90 днях" value={newcomers.length} hint={`из них ${firstMonthCount} в первом месяце`} />
      <StatCard label="Высокий риск" value={highCount} tone={highCount > 0 ? 'danger' : 'default'} hint="Нужен разговор на этой неделе" />
      <StatCard label="Средний риск" value={mediumCount} tone={mediumCount > 0 ? 'warning' : 'default'} hint="Стоит присмотреться" />
      <StatCard
        label="Просят связаться с HR"
        value={hrSignalCount}
        tone={hrSignalCount > 0 ? 'accent' : 'default'}
        hint="Видно только HR"
      />
    </StatGrid>
  )
}

type RadarContentProps = {
  meta: MetaDto
  newcomers: NewcomerListItemDto[]
}

const RadarContent = ({ meta, newcomers }: RadarContentProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readRadarFilters(searchParams)
  const filteredNewcomers = applyRadarFilters(newcomers, filters)
  const isFiltered = hasActiveFilters(filters)

  const handleFilterChange = (key: keyof RadarFilters, value: string) => {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams)
        if (value) {
          nextParams.set(FILTER_PARAM_KEYS[key], value)
        } else {
          nextParams.delete(FILTER_PARAM_KEYS[key])
        }
        return nextParams
      },
      { replace: true },
    )
  }

  const handleResetFilters = () => setSearchParams({}, { replace: true })

  return (
    <>
      <RadarSummary newcomers={newcomers} />
      <RadarFiltersBar
        meta={meta}
        filters={filters}
        isResetVisible={isFiltered}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />
      <p className={styles.count} role="status">
        {isFiltered
          ? `Найдено: ${formatCount(filteredNewcomers.length, PERSON_FORMS)} из ${newcomers.length}`
          : `Всего: ${formatCount(newcomers.length, PERSON_FORMS)}, сначала самые рискованные`}
      </p>
      {filteredNewcomers.length === 0 ? (
        <EmptyState title="Никого не нашли">Попробуйте изменить или сбросить фильтры.</EmptyState>
      ) : (
        <RadarTable newcomers={filteredNewcomers} />
      )}
    </>
  )
}

export const RadarPage = () => {
  const metaQuery = useMeta()
  const newcomersQuery = useNewcomers(HR_VIEWER)

  const renderContent = () => {
    if (metaQuery.isError) return <ErrorState error={metaQuery.error} onRetry={() => void metaQuery.refetch()} />
    if (newcomersQuery.isError) {
      return <ErrorState error={newcomersQuery.error} onRetry={() => void newcomersQuery.refetch()} />
    }
    if (metaQuery.isPending || newcomersQuery.isPending) return <LoadingState />
    return <RadarContent meta={metaQuery.data} newcomers={newcomersQuery.data} />
  }

  return (
    <>
      <title>Радар новичков — Первые 90</title>
      <PageHeader
        title="Радар новичков"
        description="Все новички первых 90 дней по компании. Риск считается по прозрачным правилам: чек-ины, встречи, наставник и план адаптации."
      />
      {renderContent()}
    </>
  )
}
