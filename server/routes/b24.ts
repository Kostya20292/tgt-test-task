import { and, count, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { Hono } from 'hono'
import type {
  B24ProcessResultDto,
  B24TaskDto,
  B24TasksDto,
  DismissTaskPayload,
  HireTaskPayload,
} from '../../shared/api.ts'
import { addDays, diffInDays, getTodayIsoDate } from '../../shared/dates.ts'
import { db, type Transaction } from '../db/client.ts'
import { b24Tasks, departments, employees, locations, newcomers, offboardings } from '../db/schema.ts'
import { conflict, notFound } from '../lib/http.ts'
import { createRandom } from '../lib/random.ts'
import { parseId } from '../lib/validation.ts'
import { requireHr } from '../lib/viewer.ts'
import { toIsoString } from '../services/mappers.ts'
import { createNewcomer } from '../services/newcomers.ts'
import { createPersonFactory } from '../seed/people.ts'
import { HIRE_DEPARTMENT_WEIGHTS, NEWCOMER_POSITIONS, SIMULATED_TASK_FIRST_ID } from '../seed/referenceData.ts'

const PROCESSED_HISTORY_LIMIT = 10
const MAX_SIMULATED_START_OFFSET_DAYS = 3

type TaskRow = typeof b24Tasks.$inferSelect

const isHirePayload = (task: TaskRow): task is TaskRow & { payload: HireTaskPayload } => task.type === 'hire'

const loadTaskDtos = async (tasks: TaskRow[]): Promise<B24TaskDto[]> => {
  const [departmentRows, locationRows, managerRows] = await Promise.all([
    db.select().from(departments),
    db.select().from(locations),
    db.select().from(employees).where(eq(employees.role, 'manager')),
  ])

  const dismissNewcomerIds = tasks
    .filter((task) => !isHirePayload(task))
    .map((task) => (task.payload as DismissTaskPayload).newcomerId)

  const dismissedRows = dismissNewcomerIds.length
    ? await db
        .select({ id: newcomers.id, startDate: newcomers.startDate })
        .from(newcomers)
        .where(inArray(newcomers.id, dismissNewcomerIds))
    : []

  const findName = (rows: { id: number; name?: string; fullName?: string }[], id: number): string => {
    const row = rows.find((candidate) => candidate.id === id)
    return row?.name ?? row?.fullName ?? '—'
  }

  return tasks.map((task): B24TaskDto => {
    const base = {
      id: task.id,
      externalId: task.externalId,
      createdAt: task.createdAt.toISOString(),
      processedAt: toIsoString(task.processedAt),
      newcomerId: task.newcomerId,
    }

    if (isHirePayload(task)) {
      return {
        ...base,
        type: 'hire',
        payload: task.payload,
        departmentName: findName(departmentRows, task.payload.departmentId),
        locationName: findName(locationRows, task.payload.locationId),
        managerName: findName(managerRows, task.payload.managerId),
      }
    }

    const payload = task.payload as DismissTaskPayload
    const startDate = dismissedRows.find((row) => row.id === payload.newcomerId)?.startDate
    return {
      ...base,
      type: 'dismiss',
      payload,
      daysWorked: startDate ? diffInDays(startDate, payload.leaveDate) + 1 : null,
    }
  })
}

const processHire = async (tx: Transaction, task: TaskRow): Promise<B24ProcessResultDto> => {
  const created = await createNewcomer(tx, task.payload as HireTaskPayload)
  await tx.update(b24Tasks).set({ newcomerId: created.id }).where(eq(b24Tasks.id, task.id))
  return { type: 'hire', newcomerId: created.id, token: created.token }
}

const processDismiss = async (tx: Transaction, task: TaskRow): Promise<B24ProcessResultDto> => {
  const payload = task.payload as DismissTaskPayload

  const [newcomer] = await tx
    .update(newcomers)
    .set({ status: 'left' })
    .where(and(eq(newcomers.id, payload.newcomerId), eq(newcomers.status, 'active')))
    .returning()
  if (!newcomer) throw conflict('Сотрудник уже не в адаптации')

  await tx.insert(offboardings).values({
    newcomerId: newcomer.id,
    leaveDate: payload.leaveDate,
    reason: payload.reason,
    daysWorked: Math.max(1, diffInDays(newcomer.startDate, payload.leaveDate) + 1),
  })
  await tx.update(b24Tasks).set({ newcomerId: newcomer.id }).where(eq(b24Tasks.id, task.id))

  return { type: 'dismiss', newcomerId: newcomer.id, token: null }
}

export const b24Routes = new Hono()

b24Routes.get('/tasks', async (context) => {
  requireHr(context)

  const [pendingRows, processedRows] = await Promise.all([
    db.select().from(b24Tasks).where(isNull(b24Tasks.processedAt)).orderBy(desc(b24Tasks.createdAt)),
    db
      .select()
      .from(b24Tasks)
      .where(isNotNull(b24Tasks.processedAt))
      .orderBy(desc(b24Tasks.processedAt), desc(b24Tasks.id))
      .limit(PROCESSED_HISTORY_LIMIT),
  ])

  const result: B24TasksDto = {
    pending: await loadTaskDtos(pendingRows),
    processed: await loadTaskDtos(processedRows),
  }
  return context.json(result)
})

b24Routes.post('/tasks/:id/process', async (context) => {
  requireHr(context)
  const taskId = parseId(context.req.param('id'))

  const result = await db.transaction(async (tx) => {
    const [task] = await tx
      .update(b24Tasks)
      .set({ processedAt: new Date() })
      .where(and(eq(b24Tasks.id, taskId), isNull(b24Tasks.processedAt)))
      .returning()

    if (!task) {
      const existing = await tx.query.b24Tasks.findFirst({ where: eq(b24Tasks.id, taskId) })
      throw existing ? conflict('Задача уже обработана') : notFound('Задача не найдена')
    }

    return task.type === 'hire' ? processHire(tx, task) : processDismiss(tx, task)
  })

  return context.json(result)
})

b24Routes.post('/simulate', async (context) => {
  requireHr(context)

  const random = createRandom()
  const departmentCode = random.weighted(HIRE_DEPARTMENT_WEIGHTS)

  const [department, existingNames, [taskCount]] = await Promise.all([
    db.query.departments.findFirst({ where: eq(departments.code, departmentCode) }),
    db.select({ fullName: newcomers.fullName }).from(newcomers),
    db.select({ value: count() }).from(b24Tasks),
  ])
  if (!department) throw notFound('Подразделение не найдено')

  const managers = await db
    .select()
    .from(employees)
    .where(and(eq(employees.role, 'manager'), eq(employees.departmentId, department.id)))
  const manager = random.pick(managers)
  if (!manager.locationId) throw notFound('У руководителя не указана локация')

  const people = createPersonFactory(random, existingNames.map(({ fullName }) => fullName))
  const payload: HireTaskPayload = {
    fullName: people.createFullName(),
    phone: people.createPhone(),
    position: random.pick(NEWCOMER_POSITIONS[departmentCode]),
    departmentId: department.id,
    locationId: manager.locationId,
    managerId: manager.id,
    startDate: addDays(getTodayIsoDate(), random.int(0, MAX_SIMULATED_START_OFFSET_DAYS)),
  }

  const [task] = await db
    .insert(b24Tasks)
    .values({
      externalId: `TASK-${SIMULATED_TASK_FIRST_ID + (taskCount?.value ?? 0)}`,
      type: 'hire',
      payload,
    })
    .returning()

  return context.json({ id: task?.id }, 201)
})
