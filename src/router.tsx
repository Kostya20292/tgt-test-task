import { createBrowserRouter } from 'react-router'
import { AppLayout } from '@/app/AppLayout.tsx'
import { NewcomerLayout } from '@/app/NewcomerLayout.tsx'
import { HomePage } from '@/features/home/HomePage.tsx'
import { B24Page } from '@/features/hr/B24Page.tsx'
import { MetricsPage } from '@/features/hr/MetricsPage.tsx'
import { RadarPage } from '@/features/hr/RadarPage.tsx'
import { ManagerPage } from '@/features/manager/ManagerPage.tsx'
import { NewcomerPage } from '@/features/newcomer/NewcomerPage.tsx'
import { NewcomerDetailPage } from '@/features/newcomers/NewcomerDetailPage.tsx'
import { NotFoundPage } from '@/features/system/NotFoundPage.tsx'
import { RouteErrorPage } from '@/features/system/RouteErrorPage.tsx'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'hr',
        children: [
          { index: true, element: <RadarPage /> },
          { path: 'b24', element: <B24Page /> },
          { path: 'metrics', element: <MetricsPage /> },
          { path: 'newcomers/:id', element: <NewcomerDetailPage role="hr" /> },
        ],
      },
      {
        path: 'manager',
        children: [
          { index: true, element: <ManagerPage /> },
          { path: 'newcomers/:id', element: <NewcomerDetailPage role="manager" /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'n/:token',
    element: <NewcomerLayout />,
    errorElement: <RouteErrorPage />,
    children: [{ index: true, element: <NewcomerPage /> }],
  },
])
