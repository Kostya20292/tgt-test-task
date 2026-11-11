import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/app/AppLayout.tsx';
import { NewcomerLayout } from '@/app/NewcomerLayout.tsx';
import { HomePage } from '@/pages/home/HomePage/HomePage.tsx';
import { B24Page } from '@/pages/hr/B24Page/B24Page.tsx';
import { MetricsPage } from '@/pages/hr/MetricsPage/MetricsPage.tsx';
import { RadarPage } from '@/pages/hr/RadarPage/RadarPage.tsx';
import { ManagerPage } from '@/pages/manager/ManagerPage/ManagerPage.tsx';
import { NewcomerPage } from '@/pages/newcomer/NewcomerPage/NewcomerPage.tsx';
import { NewcomerDetailPage } from '@/pages/newcomers/NewcomerDetailPage/NewcomerDetailPage.tsx';
import { NotFoundPage } from '@/pages/system/NotFoundPage/NotFoundPage.tsx';
import { RouteErrorPage } from '@/pages/system/RouteErrorPage/RouteErrorPage.tsx';

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
]);
