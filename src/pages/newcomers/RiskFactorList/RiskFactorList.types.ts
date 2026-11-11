import type { RiskFactor } from '@shared/risk.ts'

export type RiskFactorListProps = {
  factors: RiskFactor[]
  variant?: 'compact' | 'detailed'
  limit?: number
}
