import type { MetricsDto } from '../../shared/api.ts'
import { addDays } from '../../shared/dates.ts'
import { EARLY_LEAVE_THRESHOLD_DAYS } from '../../shared/domain.ts'
import type { RiskLevel } from '../../shared/risk.ts'
import { getDayNumber, isCheckpointDoneOnTime, isInProgram, PROGRAM_LENGTH_DAYS } from '../../shared/timeline.ts'
import { db } from '../db/client.ts'
import { toIsoString, assessNewcomerRisk } from './mappers.ts'
import { findNewcomerAggregates, type NewcomerAggregate } from './newcomers.ts'

const PERIOD_DAYS = 365
const WEEKS_IN_PROGRAM = Math.ceil(EARLY_LEAVE_THRESHOLD_DAYS / 7)

type NewcomerWithOutcome = NewcomerAggregate & {
  offboarding: { leaveDate: string; reason: string; daysWorked: number } | null
}

const share = (part: number, total: number): number => (total === 0 ? 0 : part / total)

const isEarlyLeaver = (newcomer: NewcomerWithOutcome): boolean =>
  newcomer.offboarding !== null && newcomer.offboarding.daysWorked < EARLY_LEAVE_THRESHOLD_DAYS

const countBy = <Key>(items: Key[]): Map<Key, number> =>
  items.reduce((counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1), new Map<Key, number>())

const hadAllCheckpointsOnTime = (newcomer: NewcomerWithOutcome, today: string): boolean => {
  const endDate = newcomer.offboarding?.leaveDate ?? today
  const relevant = newcomer.checkpoints.filter(
    (checkpoint) => checkpoint.dueDate <= endDate && checkpoint.dueDate < today,
  )
  return (
    relevant.length > 0 &&
    relevant.every((checkpoint) =>
      isCheckpointDoneOnTime({ dueDate: checkpoint.dueDate, doneAt: toIsoString(checkpoint.doneAt) }),
    )
  )
}

export const computeMetrics = async (today: string): Promise<MetricsDto> => {
  const periodStart = addDays(today, -(PERIOD_DAYS - 1))

  const [departmentRows, aggregates, offboardingRows] = await Promise.all([
    db.query.departments.findMany({ orderBy: (table, { asc }) => [asc(table.id)] }),
    findNewcomerAggregates(),
    db.query.offboardings.findMany(),
  ])

  const newcomers: NewcomerWithOutcome[] = aggregates.map((aggregate) => ({
    ...aggregate,
    offboarding: offboardingRows.find((row) => row.newcomerId === aggregate.id) ?? null,
  }))

  const isInPeriod = (isoDate: string): boolean => isoDate >= periodStart && isoDate <= today

  const hires = newcomers.filter((newcomer) => isInPeriod(newcomer.startDate))
  const leavers = newcomers.filter((newcomer) => newcomer.offboarding && isInPeriod(newcomer.offboarding.leaveDate))
  const earlyLeavers = leavers.filter(isEarlyLeaver)

  const activeNewcomers = newcomers.filter(
    (newcomer) => newcomer.status === 'active' && isInProgram(getDayNumber(newcomer.startDate, today)),
  )
  const riskCounts = countBy<RiskLevel>(activeNewcomers.map((newcomer) => assessNewcomerRisk(newcomer, today).level))

  const earlyLeaversByWeek = countBy(
    earlyLeavers.map((newcomer) => Math.ceil((newcomer.offboarding?.daysWorked ?? 1) / 7)),
  )

  const reasons = [...countBy(earlyLeavers.map((newcomer) => newcomer.offboarding?.reason ?? '—'))]
    .map(([reason, count]) => ({ reason, count }))
    .toSorted((first, second) => second.count - first.count)

  const cohort = hires.filter(
    (newcomer) => newcomer.offboarding !== null || getDayNumber(newcomer.startDate, today) > PROGRAM_LENGTH_DAYS,
  )
  const onTimeGroup = cohort.filter((newcomer) => hadAllCheckpointsOnTime(newcomer, today))
  const lateGroup = cohort.filter((newcomer) => !hadAllCheckpointsOnTime(newcomer, today))
  const earlyRate = (group: NewcomerWithOutcome[]): number =>
    share(group.filter(isEarlyLeaver).length, group.length)

  return {
    periodDays: PERIOD_DAYS,
    hires: hires.length,
    leaves: leavers.length,
    earlyLeaves: earlyLeavers.length,
    earlyLeaveShare: share(earlyLeavers.length, leavers.length),
    activeNewcomers: activeNewcomers.length,
    riskCounts: {
      low: riskCounts.get('low') ?? 0,
      medium: riskCounts.get('medium') ?? 0,
      high: riskCounts.get('high') ?? 0,
    },
    byDepartment: departmentRows.map((department) => {
      const departmentHires = hires.filter((newcomer) => newcomer.departmentId === department.id).length
      const departmentEarly = earlyLeavers.filter((newcomer) => newcomer.departmentId === department.id).length
      return {
        code: department.code,
        name: department.name,
        hires: departmentHires,
        earlyLeaves: departmentEarly,
        earlyLeaveRate: share(departmentEarly, departmentHires),
      }
    }),
    byWeek: Array.from({ length: WEEKS_IN_PROGRAM }, (_, index) => ({
      week: index + 1,
      count: earlyLeaversByWeek.get(index + 1) ?? 0,
    })),
    reasons,
    checkpointDiscipline: {
      cohortSize: cohort.length,
      onTimeCount: onTimeGroup.length,
      onTimeShare: share(onTimeGroup.length, cohort.length),
      earlyLeaveRateOnTime: earlyRate(onTimeGroup),
      earlyLeaveRateLate: earlyRate(lateGroup),
    },
  }
}
