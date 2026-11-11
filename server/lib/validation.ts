import type { Context } from 'hono'
import { z } from 'zod'
import { badRequest } from './http.ts'

const idSchema = z.coerce.number().int().positive()

export const parseId = (value: string | undefined): number => {
  const result = idSchema.safeParse(value)
  if (!result.success) throw badRequest('Некорректный идентификатор')
  return result.data
}

export const parseJsonBody = async <Schema extends z.ZodType>(
  context: Context,
  schema: Schema,
): Promise<z.infer<Schema>> => {
  const body: unknown = await context.req.json().catch(() => null)
  const result = schema.safeParse(body)
  if (!result.success) throw badRequest('Некорректные данные запроса')
  return result.data
}
