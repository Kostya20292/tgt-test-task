import { defineConfig, devices } from '@playwright/test'

const WEB_PORT = 5180
const API_PORT = 3001
const externalBaseUrl = process.env.E2E_BASE_URL

const localWebServers = [
  {
    command: 'pnpm dev:api',
    url: `http://localhost:${API_PORT}/api/meta`,
    reuseExistingServer: true,
  },
  {
    command: `pnpm dev:web --port ${WEB_PORT} --strictPort`,
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: true,
  },
]

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true } },
  ],
  webServer: externalBaseUrl ? undefined : localWebServers,
})
