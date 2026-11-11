import { sql } from 'drizzle-orm'
import type { HireTaskPayload } from '../../shared/api.ts'
import { addDays, atMoscowTime, getTodayIsoDate, toIsoDate } from '../../shared/dates.ts'
import type { DepartmentCode, NewcomerStatus } from '../../shared/domain.ts'
import { getDayNumber } from '../../shared/timeline.ts'
import { db, type Transaction } from '../db/client.ts'
import {
  b24Tasks,
  checkins,
  checklistItems,
  checkpoints,
  departments,
  employees,
  locations,
  newcomers,
  offboardings,
} from '../db/schema.ts'
import { createRandom, createToken, type Random, type WeightedEntry } from '../lib/random.ts'
import {
  buildChecklistDrafts,
  buildCheckpointDrafts,
  type ChecklistDraft,
  type CheckpointDraft,
} from '../services/newcomerDrafts.ts'
import { createPersonFactory, type PersonFactory } from './people.ts'
import {
  CHECKPOINT_NOTES,
  DEPARTMENTS,
  EARLY_LEAVE_DAY_BUCKETS,
  EARLY_LEAVE_DEPARTMENT_WEIGHTS,
  EARLY_LEAVE_REASONS,
  HIRE_DEPARTMENT_WEIGHTS,
  HR_CONTACT,
  LATE_LEAVE_REASONS,
  LOCATIONS,
  MANAGERS,
  MENTOR_POSITIONS,
  NEWCOMER_POSITIONS,
  POSITIVE_COMMENTS,
  PROBATION_FAILURE_MIN_DAYS,
  PROBATION_FAILURE_REASON,
  SEED_TASK_FIRST_ID,
  type LocationKey,
} from './referenceData.ts'
import {
  ACTIVE_SCENARIOS,
  HISTORY_SIZE,
  PENDING_HIRES,
  type ActiveScenario,
  type CheckinValues,
} from './scenarios.ts'

const SEED = 20_261_111
const PERIOD_DAYS = 365
const MENTORS_PER_MANAGER = 3
const FIRST_CHECKIN_DAY = 3
const CHECKIN_STEP_DAYS = 7
const INSERT_CHUNK_SIZE = 400
const HOUR_MS = 3_600_000

type ManagerRecord = {
  id: number
  fullName: string
  departmentCode: DepartmentCode
  departmentId: number
  locationId: number
}

type CheckinDraft = CheckinValues & { createdAt: Date }

type OffboardingDraft = {
  leaveDate: string
  reason: string
  daysWorked: number
}

type NewcomerPlan = HireTaskPayload & {
  token: string
  mentorId: number | null
  status: NewcomerStatus
  hrContactedAt: Date | null
  checklist: ChecklistDraft[]
  checkpoints: CheckpointDraft[]
  checkins: CheckinDraft[]
  offboarding: OffboardingDraft | null
  dayNumber: number
  dismissTaskReason?: string
}

type SeedContext = {
  today: string
  random: Random
  people: PersonFactory
  managersByDepartment: Map<DepartmentCode, ManagerRecord[]>
  mentorIdsByTeam: Map<string, number[]>
  roundRobinByDepartment: Map<DepartmentCode, number>
}

const getTeamKey = (departmentId: number, locationId: number): string => `${departmentId}:${locationId}`

const insertInChunks = async <Row>(rows: Row[], insert: (part: Row[]) => Promise<unknown>): Promise<void> => {
  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    await insert(rows.slice(index, index + INSERT_CHUNK_SIZE))
  }
}

const getDepartmentManagers = (context: SeedContext, departmentCode: DepartmentCode): ManagerRecord[] => {
  const managers = context.managersByDepartment.get(departmentCode)
  if (!managers?.length) throw new Error(`No managers for department ${departmentCode}`)
  return managers
}

const pickRoundRobinManager = (context: SeedContext, departmentCode: DepartmentCode): ManagerRecord => {
  const managers = getDepartmentManagers(context, departmentCode)
  const index = context.roundRobinByDepartment.get(departmentCode) ?? 0
  context.roundRobinByDepartment.set(departmentCode, index + 1)
  return managers[index % managers.length] as ManagerRecord
}

const pickScenarioManager = (context: SeedContext, scenario: ActiveScenario): ManagerRecord => {
  if (!scenario.managerName) return pickRoundRobinManager(context, scenario.departmentCode)

  const manager = getDepartmentManagers(context, scenario.departmentCode).find(
    (candidate) => candidate.fullName === scenario.managerName,
  )
  if (!manager) throw new Error(`Manager ${scenario.managerName} not found`)
  return manager
}

const pickMentorId = (context: SeedContext, manager: ManagerRecord): number =>
  context.random.pick(context.mentorIdsByTeam.get(getTeamKey(manager.departmentId, manager.locationId)) ?? [])

const getDayDate = (startDate: string, dayNumber: number): string => addDays(startDate, dayNumber - 1)

const buildBasePlan = (
  context: SeedContext,
  manager: ManagerRecord,
  startDate: string,
): Omit<NewcomerPlan, 'checklist' | 'checkpoints' | 'checkins' | 'offboarding' | 'status' | 'hrContactedAt' | 'mentorId'> => ({
  token: createToken(context.random),
  fullName: context.people.createFullName(),
  phone: context.people.createPhone(),
  position: context.random.pick(NEWCOMER_POSITIONS[manager.departmentCode]),
  departmentId: manager.departmentId,
  locationId: manager.locationId,
  managerId: manager.id,
  startDate,
  dayNumber: getDayNumber(startDate, context.today),
})

const buildRoutineCheckin = (random: Random): CheckinValues => ({
  mood: random.pick([3, 4, 4, 5, 5] as const),
  clarity: random.weighted([['yes', 8], ['partly', 2]] as const),
  support: random.weighted([['yes', 3], ['partly', 1]] as const),
  comment: random.chance(0.3) ? random.pick(POSITIVE_COMMENTS) : null,
  wantsHr: false,
})

const getCheckinDays = (dayNumber: number, stopAfterDay = Number.POSITIVE_INFINITY): number[] => {
  const days: number[] = []
  for (let day = FIRST_CHECKIN_DAY; day < dayNumber && day <= stopAfterDay; day += CHECKIN_STEP_DAYS) {
    days.push(day)
  }
  return days
}

const completeChecklist = (
  drafts: ChecklistDraft[],
  startDate: string,
  dayNumber: number,
  doneShare: number,
): ChecklistDraft[] => {
  const dueCount = drafts.filter((draft) => draft.dueDay < dayNumber).length
  const doneCount = Math.floor(dueCount * doneShare)
  let completed = 0

  return drafts.map((draft) => {
    if (draft.dueDay >= dayNumber || completed >= doneCount) return draft
    completed += 1
    return { ...draft, doneAt: atMoscowTime(getDayDate(startDate, draft.dueDay), '17:00') }
  })
}

const buildActivePlan = (context: SeedContext, scenario: ActiveScenario): NewcomerPlan => {
  const { random, today } = context
  const manager = pickScenarioManager(context, scenario)
  const startDate = addDays(today, -(scenario.dayNumber - 1))
  const hasMentor = (scenario.hasMentor ?? true) && scenario.dayNumber >= 2
  const missedCheckpointDays = scenario.missedCheckpointDays ?? []

  const checkinDays = getCheckinDays(scenario.dayNumber, scenario.stopCheckinsAfterDay)
  const plannedCheckins = checkinDays.map((day, index) => ({
    ...buildRoutineCheckin(random),
    ...(index === checkinDays.length - 1 ? scenario.lastCheckin : {}),
    createdAt: atMoscowTime(getDayDate(startDate, day), '19:00'),
  }))
  const lastCheckin = plannedCheckins.at(-1)

  const plannedCheckpoints = buildCheckpointDrafts(startDate).map((draft) => {
    if (draft.dueDate >= today || missedCheckpointDays.includes(draft.day)) return draft
    return { ...draft, doneAt: atMoscowTime(draft.dueDate, '16:00'), note: random.pick(CHECKPOINT_NOTES) }
  })

  return {
    ...buildBasePlan(context, manager, startDate),
    mentorId: hasMentor ? pickMentorId(context, manager) : null,
    status: 'active',
    hrContactedAt:
      scenario.hrContacted && lastCheckin
        ? atMoscowTime(addDays(toIsoDate(lastCheckin.createdAt), 1), '11:00')
        : null,
    checklist: completeChecklist(
      buildChecklistDrafts(manager.departmentCode),
      startDate,
      scenario.dayNumber,
      scenario.checklistDoneShare ?? 1,
    ),
    checkpoints: plannedCheckpoints,
    checkins: plannedCheckins,
    offboarding: null,
    dismissTaskReason: scenario.dismissTaskReason,
  }
}

const completeCheckpointsHistorically = (
  context: SeedContext,
  startDate: string,
  endDate: string,
  onTimeProbability: number,
): CheckpointDraft[] =>
  buildCheckpointDrafts(startDate)
    .filter((draft) => draft.dueDate <= endDate)
    .map((draft) => {
      const { random, today } = context
      if (random.chance(onTimeProbability)) {
        return { ...draft, doneAt: atMoscowTime(draft.dueDate, '16:00'), note: random.pick(CHECKPOINT_NOTES) }
      }

      const lateDate = addDays(draft.dueDate, random.int(2, 8))
      if (lateDate >= today || random.chance(0.5)) return draft

      return { ...draft, doneAt: atMoscowTime(lateDate, '16:00'), note: random.pick(CHECKPOINT_NOTES) }
    })

const buildHistoryPlan = (
  context: SeedContext,
  departmentCode: DepartmentCode,
  startDate: string,
  outcome: { offboarding: OffboardingDraft | null; onTimeProbability: number },
): NewcomerPlan => {
  const manager = pickRoundRobinManager(context, departmentCode)
  const endDate = outcome.offboarding?.leaveDate ?? addDays(context.today, -1)

  return {
    ...buildBasePlan(context, manager, startDate),
    mentorId: pickMentorId(context, manager),
    status: outcome.offboarding ? 'left' : 'active',
    hrContactedAt: null,
    checklist: [],
    checkpoints: completeCheckpointsHistorically(context, startDate, endDate, outcome.onTimeProbability),
    checkins: [],
    offboarding: outcome.offboarding,
  }
}

const buildLeaverPlan = (
  context: SeedContext,
  departmentCode: DepartmentCode,
  daysWorked: number,
  reason: string,
  onTimeProbability: number,
): NewcomerPlan => {
  const leaveDaysAgo = context.random.int(1, Math.max(1, PERIOD_DAYS - daysWorked))
  const leaveDate = addDays(context.today, -leaveDaysAgo)
  const startDate = addDays(leaveDate, -(daysWorked - 1))
  return buildHistoryPlan(context, departmentCode, startDate, {
    offboarding: { leaveDate, reason, daysWorked },
    onTimeProbability,
  })
}

const buildHistoryPlans = (context: SeedContext): NewcomerPlan[] => {
  const { random, today } = context

  const passed = Array.from({ length: HISTORY_SIZE.passed }, () =>
    buildHistoryPlan(context, random.weighted(HIRE_DEPARTMENT_WEIGHTS), addDays(today, -random.int(91, PERIOD_DAYS - 1)), {
      offboarding: null,
      onTimeProbability: 0.9,
    }),
  )

  const earlyLeavers = Array.from({ length: HISTORY_SIZE.earlyLeavers }, () => {
    const [minDays, maxDays] = random.weighted(EARLY_LEAVE_DAY_BUCKETS)
    const daysWorked = random.int(minDays, maxDays)
    const reasons: WeightedEntry<string>[] =
      daysWorked >= PROBATION_FAILURE_MIN_DAYS
        ? [...EARLY_LEAVE_REASONS, [PROBATION_FAILURE_REASON, 40]]
        : EARLY_LEAVE_REASONS
    return buildLeaverPlan(
      context,
      random.weighted(EARLY_LEAVE_DEPARTMENT_WEIGHTS),
      daysWorked,
      random.weighted(reasons),
      0.45,
    )
  })

  const lateLeavers = Array.from({ length: HISTORY_SIZE.lateLeavers }, () => {
    const daysWorked = random.int(91, 700)
    const leaveDaysAgo = random.int(1, PERIOD_DAYS - 1)
    const leaveDate = addDays(today, -leaveDaysAgo)
    return buildHistoryPlan(context, random.weighted(HIRE_DEPARTMENT_WEIGHTS), addDays(leaveDate, -(daysWorked - 1)), {
      offboarding: { leaveDate, reason: random.weighted(LATE_LEAVE_REASONS), daysWorked },
      onTimeProbability: 0.85,
    })
  })

  return [...passed, ...earlyLeavers, ...lateLeavers]
}

const insertReferenceData = async (tx: Transaction, random: Random) => {
  const departmentRows = await tx.insert(departments).values(DEPARTMENTS).returning()
  const departmentIdByCode = new Map(departmentRows.map((row) => [row.code, row.id]))

  const locationRows = await tx
    .insert(locations)
    .values(LOCATIONS.map(({ name }) => ({ name })))
    .returning()
  const locationIdByKey = new Map<LocationKey, number>(
    LOCATIONS.map(({ key, name }) => [key, locationRows.find((row) => row.name === name)?.id ?? 0]),
  )

  const resolveIds = (departmentCode: DepartmentCode, locationKey: LocationKey) => {
    const departmentId = departmentIdByCode.get(departmentCode)
    const locationId = locationIdByKey.get(locationKey)
    if (!departmentId || !locationId) throw new Error('Reference data is inconsistent')
    return { departmentId, locationId }
  }

  const managerRows = await tx
    .insert(employees)
    .values(
      MANAGERS.map((manager) => ({
        fullName: manager.fullName,
        position: manager.position,
        phone: manager.phone,
        role: 'manager' as const,
        ...resolveIds(manager.departmentCode, manager.locationKey),
      })),
    )
    .returning()

  await tx.insert(employees).values({ ...HR_CONTACT, role: 'hr' })

  const managers: ManagerRecord[] = MANAGERS.map((manager, index) => {
    const row = managerRows[index]
    if (!row?.departmentId || !row.locationId) throw new Error('Manager insert failed')
    return {
      id: row.id,
      fullName: manager.fullName,
      departmentCode: manager.departmentCode,
      departmentId: row.departmentId,
      locationId: row.locationId,
    }
  })

  const people = createPersonFactory(random, [...MANAGERS.map(({ fullName }) => fullName), HR_CONTACT.fullName])

  const mentorRows = await tx
    .insert(employees)
    .values(
      managers.flatMap((manager) =>
        Array.from({ length: MENTORS_PER_MANAGER }, () => ({
          fullName: people.createFullName(),
          position: random.pick(MENTOR_POSITIONS[manager.departmentCode]),
          phone: people.createPhone(),
          role: 'staff' as const,
          departmentId: manager.departmentId,
          locationId: manager.locationId,
        })),
      ),
    )
    .returning()

  const mentorIdsByTeam = new Map<string, number[]>()
  for (const mentor of mentorRows) {
    if (!mentor.departmentId || !mentor.locationId) continue
    const key = getTeamKey(mentor.departmentId, mentor.locationId)
    mentorIdsByTeam.set(key, [...(mentorIdsByTeam.get(key) ?? []), mentor.id])
  }

  const managersByDepartment = new Map<DepartmentCode, ManagerRecord[]>()
  for (const manager of managers) {
    managersByDepartment.set(manager.departmentCode, [
      ...(managersByDepartment.get(manager.departmentCode) ?? []),
      manager,
    ])
  }

  return { people, managersByDepartment, mentorIdsByTeam }
}

const insertNewcomerPlans = async (tx: Transaction, plans: NewcomerPlan[]): Promise<Map<string, number>> => {
  const idByToken = new Map<string, number>()

  await insertInChunks(plans, async (part) => {
    const rows = await tx
      .insert(newcomers)
      .values(
        part.map((plan) => ({
          token: plan.token,
          fullName: plan.fullName,
          position: plan.position,
          phone: plan.phone,
          departmentId: plan.departmentId,
          locationId: plan.locationId,
          managerId: plan.managerId,
          mentorId: plan.mentorId,
          startDate: plan.startDate,
          status: plan.status,
          hrContactedAt: plan.hrContactedAt,
        })),
      )
      .returning({ id: newcomers.id, token: newcomers.token })
    for (const row of rows) idByToken.set(row.token, row.id)
  })

  const getId = (plan: NewcomerPlan): number => {
    const id = idByToken.get(plan.token)
    if (!id) throw new Error('Newcomer insert failed')
    return id
  }

  const withNewcomerId = <Draft>(selector: (plan: NewcomerPlan) => Draft[]) =>
    plans.flatMap((plan) => selector(plan).map((draft) => ({ ...draft, newcomerId: getId(plan) })))

  await insertInChunks(withNewcomerId((plan) => plan.checklist), (part) => tx.insert(checklistItems).values(part))
  await insertInChunks(withNewcomerId((plan) => plan.checkpoints), (part) => tx.insert(checkpoints).values(part))
  await insertInChunks(withNewcomerId((plan) => plan.checkins), (part) => tx.insert(checkins).values(part))
  await insertInChunks(
    withNewcomerId((plan) => (plan.offboarding ? [plan.offboarding] : [])),
    (part) => tx.insert(offboardings).values(part),
  )

  return idByToken
}

const toHirePayload = (plan: HireTaskPayload): HireTaskPayload => ({
  fullName: plan.fullName,
  phone: plan.phone,
  position: plan.position,
  departmentId: plan.departmentId,
  locationId: plan.locationId,
  managerId: plan.managerId,
  startDate: plan.startDate,
})

const insertB24Tasks = async (
  tx: Transaction,
  context: SeedContext,
  activePlans: NewcomerPlan[],
  idByToken: Map<string, number>,
): Promise<void> => {
  let taskNumber = SEED_TASK_FIRST_ID
  const nextExternalId = (): string => `TASK-${taskNumber++}`
  const now = Date.now()

  const processedHires = activePlans
    .filter((plan) => plan.dayNumber <= 14)
    .toSorted((first, second) => first.startDate.localeCompare(second.startDate))
    .map((plan) => ({
      externalId: nextExternalId(),
      type: 'hire' as const,
      payload: toHirePayload(plan),
      createdAt: atMoscowTime(addDays(plan.startDate, -7), '10:00'),
      processedAt: atMoscowTime(addDays(plan.startDate, -6), '12:00'),
      newcomerId: idByToken.get(plan.token) ?? null,
    }))

  const pendingHires = PENDING_HIRES.map(({ departmentCode, startInDays }, index) => {
    const manager = getDepartmentManagers(context, departmentCode)[0] as ManagerRecord
    return {
      externalId: nextExternalId(),
      type: 'hire' as const,
      payload: {
        fullName: context.people.createFullName(),
        phone: context.people.createPhone(),
        position: context.random.pick(NEWCOMER_POSITIONS[departmentCode]),
        departmentId: manager.departmentId,
        locationId: manager.locationId,
        managerId: manager.id,
        startDate: addDays(context.today, startInDays),
      },
      createdAt: new Date(now - (PENDING_HIRES.length - index + 1) * HOUR_MS),
      processedAt: null,
      newcomerId: null,
    }
  })

  const pendingDismissals = activePlans
    .filter((plan) => plan.dismissTaskReason)
    .map((plan) => ({
      externalId: nextExternalId(),
      type: 'dismiss' as const,
      payload: {
        newcomerId: idByToken.get(plan.token) ?? 0,
        fullName: plan.fullName,
        leaveDate: context.today,
        reason: plan.dismissTaskReason ?? '',
      },
      createdAt: new Date(now - HOUR_MS / 2),
      processedAt: null,
      newcomerId: null,
    }))

  await tx.insert(b24Tasks).values([...processedHires, ...pendingHires, ...pendingDismissals])
}

export const seedDatabase = async (): Promise<{ newcomers: number }> =>
  db.transaction(async (tx) => {
    await tx.execute(
      sql`truncate table b24_tasks, offboardings, checkins, checkpoints, checklist_items, newcomers, employees, locations, departments restart identity cascade`,
    )

    const random = createRandom(SEED)
    const today = getTodayIsoDate()
    const reference = await insertReferenceData(tx, random)

    const context: SeedContext = {
      today,
      random,
      ...reference,
      roundRobinByDepartment: new Map(),
    }

    const activePlans = ACTIVE_SCENARIOS.map((scenario) => buildActivePlan(context, scenario))
    const plans = [...activePlans, ...buildHistoryPlans(context)]
    const idByToken = await insertNewcomerPlans(tx, plans)

    await insertB24Tasks(tx, context, activePlans, idByToken)

    return { newcomers: plans.length }
  })
