import { createContext, useContext } from 'react'
import type { ManagerDto, Viewer } from '@shared/api.ts'
import { useMeta } from '@/api/hooks.ts'

export type ManagerSelectionContextValue = {
  selectedManagerId: number | null
  selectManager: (managerId: number) => void
}

export const ManagerSelectionContext = createContext<ManagerSelectionContextValue | null>(null)

export const MANAGER_STORAGE_KEY = 'pervye90.managerId'

type CurrentManager = {
  manager: ManagerDto | null
  managers: ManagerDto[]
  viewer: Viewer | null
  selectManager: (managerId: number) => void
  metaQuery: ReturnType<typeof useMeta>
}

export const useCurrentManager = (): CurrentManager => {
  const context = useContext(ManagerSelectionContext)
  if (!context) throw new Error('useCurrentManager must be used inside ManagerSelectionProvider')

  const metaQuery = useMeta()
  const managers = metaQuery.data?.managers ?? []
  const manager = managers.find((item) => item.id === context.selectedManagerId) ?? managers[0] ?? null
  const viewer: Viewer | null = manager ? { role: 'manager', managerId: manager.id } : null

  return { manager, managers, viewer, selectManager: context.selectManager, metaQuery }
}
