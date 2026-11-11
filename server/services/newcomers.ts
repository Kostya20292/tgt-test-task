import { and, eq, type SQL } from 'drizzle-orm'
import type { HireTaskPayload, NewcomerDetailDto, PersonDto } from '../../shared/api.ts'
import { db, type DbExecutor } from '../db/client.ts'
import { checklistItems, checkpoints, departments, employees, newcomers } from '../db/schema.ts'
import { forbidden, notFound } from '../lib/http.ts'
import { createToken } from '../lib/random.ts'
import type { Viewer } from '../lib/viewer.ts'
import { toDetailDto, toPersonDto } from './mappers.ts'
import { buildChecklistDrafts, buildCheckpointDrafts } from './newcomerDrafts.ts'

const AGGREGATE_RELATIONS = {
  department: true,
  location: true,
  manager: true,
  mentor: true,
  checkpoints: true,
  checklistItems: true,
  checkins: true,
} as const

export const findNewcomerAggregates = (where?: SQL, executor: DbExecutor = db) =>
  executor.query.newcomers.findMany({ where, with: AGGREGATE_RELATIONS })

export type NewcomerAggregate = Awaited<ReturnType<typeof findNewcomerAggregates>>[number]

export const findNewcomerAggregate = async (
  where: SQL,
  executor: DbExecutor = db,
): Promise<NewcomerAggregate | null> => {
  const [aggregate] = await findNewcomerAggregates(where, executor)
  return aggregate ?? null
}

export const assertViewerCanAccess = ({ managerId }: { managerId: number }, viewer: Viewer): void => {
  if (viewer.role === 'manager' && managerId !== viewer.managerId) {
    throw forbidden('Этот новичок не в вашей команде')
  }
}

export const findMentorCandidates = async (
  aggregate: Pick<NewcomerAggregate, 'departmentId' | 'locationId'>,
  executor: DbExecutor = db,
): Promise<PersonDto[]> => {
  const rows = await executor.query.employees.findMany({
    where: and(
      eq(employees.role, 'staff'),
      eq(employees.departmentId, aggregate.departmentId),
      eq(employees.locationId, aggregate.locationId),
    ),
    orderBy: (table, { asc }) => [asc(table.fullName)],
  })
  return rows.map(toPersonDto)
}

export const getNewcomerDetail = async (
  newcomerId: number,
  viewer: Viewer,
  today: string,
): Promise<NewcomerDetailDto> => {
  const aggregate = await findNewcomerAggregate(eq(newcomers.id, newcomerId))
  if (!aggregate) throw notFound('Новичок не найден')

  assertViewerCanAccess(aggregate, viewer)

  const mentorCandidates = await findMentorCandidates(aggregate)
  return toDetailDto(aggregate, today, viewer, mentorCandidates)
}

export const createNewcomer = async (
  executor: DbExecutor,
  payload: HireTaskPayload,
): Promise<{ id: number; token: string }> => {
  const department = await executor.query.departments.findFirst({
    where: eq(departments.id, payload.departmentId),
  })
  if (!department) throw notFound('Подразделение не найдено')

  const [created] = await executor
    .insert(newcomers)
    .values({ ...payload, token: createToken(), status: 'active' })
    .returning({ id: newcomers.id, token: newcomers.token })

  if (!created) throw new Error('Failed to create newcomer')

  await executor
    .insert(checklistItems)
    .values(buildChecklistDrafts(department.code).map((draft) => ({ ...draft, newcomerId: created.id })))

  await executor
    .insert(checkpoints)
    .values(buildCheckpointDrafts(payload.startDate).map((draft) => ({ ...draft, newcomerId: created.id })))

  return created
}
