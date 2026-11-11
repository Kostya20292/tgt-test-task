import { useState, type ReactNode } from 'react'
import { MANAGER_STORAGE_KEY, ManagerSelectionContext } from './managerSelection.ts'

const readStoredManagerId = (): number | null => {
  const storedValue = Number(localStorage.getItem(MANAGER_STORAGE_KEY))
  return Number.isInteger(storedValue) && storedValue > 0 ? storedValue : null
}

type ManagerSelectionProviderProps = {
  children: ReactNode
}

export const ManagerSelectionProvider = ({ children }: ManagerSelectionProviderProps) => {
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(readStoredManagerId)

  const selectManager = (managerId: number) => {
    localStorage.setItem(MANAGER_STORAGE_KEY, String(managerId))
    setSelectedManagerId(managerId)
  }

  return (
    <ManagerSelectionContext value={{ selectedManagerId, selectManager }}>{children}</ManagerSelectionContext>
  )
}
