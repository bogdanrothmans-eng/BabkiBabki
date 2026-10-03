import { defineConfig, devices } from "@playwright/test"

const port = Number(process.env.PORT ?? 3100)

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "ru-RU",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // A production build: the dev server compiles routes on first hit and may
  // reload the page mid-test, which made runs flaky.
  webServer: {
    command: `next build && DATA_DIR=.e2e-data next start -p ${port}`,
    port,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
})
