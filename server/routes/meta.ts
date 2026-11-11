import { asc, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import type { ManagerDto, MetaDto } from '../../shared/api.ts'
import { getTodayIsoDate } from '../../shared/dates.ts'
import { getDayNumber, isInProgram } from '../../shared/timeline.ts'
import { db } from '../db/client.ts'
import { departments, employees, locations, newcomers } from '../db/schema.ts'
import { serviceUnavailable } from '../lib/http.ts'
import { toDepartmentDto, toLocationDto, toPersonDto } from '../services/mappers.ts'

export const metaRoutes = new Hono()

metaRoutes.get('/', async (context) => {
  const today = getTodayIsoDate()

  const [departmentRows, locationRows, staffRows, activeRows] = await Promise.all([
    db.select().from(departments).orderBy(asc(departments.id)),
    db.select().from(locations).orderBy(asc(locations.id)),
    db
      .select()
      .from(employees)
      .where(inArray(employees.role, ['manager', 'hr']))
      .orderBy(asc(employees.id)),
    db
      .select({ managerId: newcomers.managerId, startDate: newcomers.startDate })
      .from(newcomers)
      .where(eq(newcomers.status, 'active')),
  ])

  const hr = staffRows.find((employee) => employee.role === 'hr')
  if (!hr) throw serviceUnavailable('Демо-данные не загружены. Нажмите «Сбросить демо-данные».')

  const activeCountByManager = activeRows
    .filter((row) => isInProgram(getDayNumber(row.startDate, today)))
    .reduce((counts, row) => counts.set(row.managerId, (counts.get(row.managerId) ?? 0) + 1), new Map<number, number>())

  const managers: ManagerDto[] = staffRows
    .filter((employee) => employee.role === 'manager')
    .map((employee) => ({
      ...toPersonDto(employee),
      departmentId: employee.departmentId ?? 0,
      locationId: employee.locationId ?? 0,
      activeNewcomers: activeCountByManager.get(employee.id) ?? 0,
    }))

  const meta: MetaDto = {
    today,
    departments: departmentRows.map(toDepartmentDto),
    locations: locationRows.map(toLocationDto),
    managers,
    hr: toPersonDto(hr),
  }

  return context.json(meta)
})
