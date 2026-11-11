import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { ApiError } from '@/api/client.ts'
import { ManagerSelectionProvider } from '@/app/ManagerSelectionProvider.tsx'
import { router } from '@/router.tsx'
import '@/styles/global.scss'

const MAX_QUERY_RETRIES = 1

const shouldRetryQuery = (failureCount: number, error: Error): boolean => {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < MAX_QUERY_RETRIES
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: true,
    },
  },
})

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ManagerSelectionProvider>
        <RouterProvider router={router} />
      </ManagerSelectionProvider>
    </QueryClientProvider>
  </StrictMode>,
)
