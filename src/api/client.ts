import { VIEWER_MANAGER_HEADER, VIEWER_ROLE_HEADER, type ApiErrorDto, type Viewer } from '@shared/api.ts'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  viewer?: Viewer
}

const isApiErrorDto = (value: unknown): value is ApiErrorDto =>
  typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string'

const buildHeaders = (body: unknown, viewer?: Viewer): Headers => {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (!viewer) return headers

  headers.set(VIEWER_ROLE_HEADER, viewer.role)
  if (viewer.role === 'manager') headers.set(VIEWER_MANAGER_HEADER, String(viewer.managerId))
  return headers
}

export const apiRequest = async <Response>(
  path: string,
  { method = 'GET', body, viewer }: RequestOptions = {},
): Promise<Response> => {
  const response = await fetch(`/api${path}`, {
    method,
    headers: buildHeaders(body, viewer),
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError('Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.', 0)
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(isApiErrorDto(data) ? data.error : 'Не удалось выполнить запрос', response.status)
  }

  return data as Response
}

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Что-то пошло не так'
