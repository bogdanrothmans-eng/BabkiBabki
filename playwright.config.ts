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
  webServer: {
    command: `DATA_DIR=.e2e-data next dev -p ${port}`,
    port,
    reuseExistingServer: !process.env.CI,
  },
})
