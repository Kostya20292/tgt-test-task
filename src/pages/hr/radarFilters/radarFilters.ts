import type { NewcomerListItemDto } from '@shared/api.ts'
import type { RiskLevel } from '@shared/risk.ts'

export type RadarFilters = {
  search: string
  departmentCode: string
  riskLevel: RiskLevel | ''
  managerId: string
}

export const FILTER_PARAM_KEYS = {
  search: 'q',
  departmentCode: 'department',
  riskLevel: 'risk',
  managerId: 'manager',
} as const satisfies Record<keyof RadarFilters, string>

const RISK_LEVELS: RiskLevel[] = ['high', 'medium', 'low']

const parseRiskLevel = (value: string | null): RiskLevel | '' =>
  RISK_LEVELS.find((level) => level === value) ?? ''

export const readRadarFilters = (params: URLSearchParams): RadarFilters => ({
  search: params.get(FILTER_PARAM_KEYS.search) ?? '',
  departmentCode: params.get(FILTER_PARAM_KEYS.departmentCode) ?? '',
  riskLevel: parseRiskLevel(params.get(FILTER_PARAM_KEYS.riskLevel)),
  managerId: params.get(FILTER_PARAM_KEYS.managerId) ?? '',
})

export const hasActiveFilters = (filters: RadarFilters): boolean => Object.values(filters).some(Boolean)

export const applyRadarFilters = (newcomers: NewcomerListItemDto[], filters: RadarFilters): NewcomerListItemDto[] => {
  const searchQuery = filters.search.trim().toLocaleLowerCase('ru')

  return newcomers.filter((newcomer) => {
    if (filters.departmentCode && newcomer.department.code !== filters.departmentCode) return false
    if (filters.riskLevel && newcomer.risk.level !== filters.riskLevel) return false
    if (filters.managerId && String(newcomer.manager.id) !== filters.managerId) return false
    if (!searchQuery) return true

    const searchableText = [newcomer.fullName, newcomer.position, newcomer.location.name]
      .join(' ')
      .toLocaleLowerCase('ru')
    return searchableText.includes(searchQuery)
  })
}
