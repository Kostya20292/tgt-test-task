import type { Context } from 'hono'
import { z } from 'zod'
import { VIEWER_MANAGER_HEADER, VIEWER_ROLE_HEADER, type Viewer } from '../../shared/api.ts'
import { badRequest, forbidden } from './http.ts'

export type { Viewer }

const viewerSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('hr') }),
  z.object({ role: z.literal('manager'), managerId: z.coerce.number().int().positive() }),
])

export const getViewer = (context: Context): Viewer => {
  const result = viewerSchema.safeParse({
    role: context.req.header(VIEWER_ROLE_HEADER),
    managerId: context.req.header(VIEWER_MANAGER_HEADER),
  })
  if (!result.success) throw badRequest('Не указана роль пользователя')
  return result.data
}

export const requireHr = (context: Context): Viewer => {
  const viewer = getViewer(context)
  if (viewer.role !== 'hr') throw forbidden('Доступно только HR')
  return viewer
}

export const requireManager = (context: Context): Extract<Viewer, { role: 'manager' }> => {
  const viewer = getViewer(context)
  if (viewer.role !== 'manager') throw forbidden('Доступно только руководителю')
  return viewer
}
