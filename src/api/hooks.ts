import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import type {
  B24ProcessResultDto,
  B24TasksDto,
  CheckinInput,
  MetaDto,
  MetricsDto,
  NewcomerDetailDto,
  NewcomerListItemDto,
  NewcomerPageDto,
  ShowcaseNewcomerDto,
  Viewer,
} from '@shared/api.ts'
import { apiRequest } from './client.ts'

export const queryKeys = {
  meta: ['meta'],
  showcase: ['showcase'],
  b24Tasks: ['b24-tasks'],
  metrics: ['metrics'],
  newcomers: (viewer: Viewer | null) => ['newcomers', viewer],
  newcomer: (id: number, viewer: Viewer | null) => ['newcomer', id, viewer],
  newcomerPage: (token: string) => ['newcomer-page', token],
} as const

const HR_VIEWER: Viewer = { role: 'hr' }

const useInvalidateAfter = <Data>(queryKey?: QueryKey) => {
  const queryClient = useQueryClient()
  return async (data: Data) => {
    if (queryKey) queryClient.setQueryData(queryKey, data)
    await queryClient.invalidateQueries()
  }
}

export const useMeta = () =>
  useQuery({ queryKey: queryKeys.meta, queryFn: () => apiRequest<MetaDto>('/meta') })

export const useShowcase = () =>
  useQuery({ queryKey: queryKeys.showcase, queryFn: () => apiRequest<ShowcaseNewcomerDto[]>('/demo/showcase') })

export const useNewcomers = (viewer: Viewer | null) =>
  useQuery({
    queryKey: queryKeys.newcomers(viewer),
    queryFn: () => apiRequest<NewcomerListItemDto[]>('/newcomers', { viewer: viewer ?? undefined }),
    enabled: viewer !== null,
  })

export const useNewcomer = (id: number, viewer: Viewer | null) =>
  useQuery({
    queryKey: queryKeys.newcomer(id, viewer),
    queryFn: () => apiRequest<NewcomerDetailDto>(`/newcomers/${id}`, { viewer: viewer ?? undefined }),
    enabled: viewer !== null && Number.isInteger(id),
  })

export const useNewcomerPage = (token: string) =>
  useQuery({
    queryKey: queryKeys.newcomerPage(token),
    queryFn: () => apiRequest<NewcomerPageDto>(`/n/${token}`),
  })

export const useB24Tasks = () =>
  useQuery({
    queryKey: queryKeys.b24Tasks,
    queryFn: () => apiRequest<B24TasksDto>('/b24/tasks', { viewer: HR_VIEWER }),
  })

export const useMetrics = () =>
  useQuery({
    queryKey: queryKeys.metrics,
    queryFn: () => apiRequest<MetricsDto>('/metrics', { viewer: HR_VIEWER }),
  })

export const useAssignMentor = (newcomerId: number, viewer: Viewer) =>
  useMutation({
    mutationFn: (mentorId: number | null) =>
      apiRequest<NewcomerDetailDto>(`/newcomers/${newcomerId}/mentor`, {
        method: 'PATCH',
        body: { mentorId },
        viewer,
      }),
    onSuccess: useInvalidateAfter(queryKeys.newcomer(newcomerId, viewer)),
  })

export const useMarkHrContact = (newcomerId: number) =>
  useMutation({
    mutationFn: () =>
      apiRequest<NewcomerDetailDto>(`/newcomers/${newcomerId}/hr-contact`, { method: 'POST', viewer: HR_VIEWER }),
    onSuccess: useInvalidateAfter(queryKeys.newcomer(newcomerId, HR_VIEWER)),
  })

export const useUpdateCheckpoint = (newcomerId: number, viewer: Viewer) =>
  useMutation({
    mutationFn: ({ checkpointId, done, note }: { checkpointId: number; done: boolean; note: string }) =>
      apiRequest<NewcomerDetailDto>(`/checkpoints/${checkpointId}`, {
        method: 'PATCH',
        body: { done, note },
        viewer,
      }),
    onSuccess: useInvalidateAfter(queryKeys.newcomer(newcomerId, viewer)),
  })

export const useToggleChecklistItem = (token: string) =>
  useMutation({
    mutationFn: ({ itemId, done }: { itemId: number; done: boolean }) =>
      apiRequest<NewcomerPageDto>(`/n/${token}/checklist/${itemId}`, { method: 'PATCH', body: { done } }),
    onSuccess: useInvalidateAfter(queryKeys.newcomerPage(token)),
  })

export const useSubmitCheckin = (token: string) =>
  useMutation({
    mutationFn: (input: CheckinInput) =>
      apiRequest<NewcomerPageDto>(`/n/${token}/checkins`, { method: 'POST', body: input }),
    onSuccess: useInvalidateAfter(queryKeys.newcomerPage(token)),
  })

export const useProcessB24Task = () =>
  useMutation({
    mutationFn: (taskId: number) =>
      apiRequest<B24ProcessResultDto>(`/b24/tasks/${taskId}/process`, { method: 'POST', viewer: HR_VIEWER }),
    onSuccess: useInvalidateAfter(),
  })

export const useSimulateB24Task = () =>
  useMutation({
    mutationFn: () => apiRequest<{ id: number }>('/b24/simulate', { method: 'POST', viewer: HR_VIEWER }),
    onSuccess: useInvalidateAfter(),
  })

export const useResetDemo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiRequest<{ newcomers: number }>('/demo/reset', { method: 'POST' }),
    onSuccess: () => queryClient.resetQueries(),
  })
}
