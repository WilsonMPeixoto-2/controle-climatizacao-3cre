import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', testMatch: ['attendance-estimates.spec.js', 'attendance-forecast.spec.js'],
  fullyParallel: false, workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  outputDir: 'test-results-attendance',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-attendance', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'], baseURL: 'http://localhost:5180',
    screenshot: 'only-on-failure', trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --port 5180 --strictPort', url: 'http://localhost:5180',
    reuseExistingServer: false, timeout: 120000,
    env: {
      VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_PROJECT_ID: '', VITE_FIREBASE_APP_ID: '',
      VITE_FINANCE_FIRESTORE_EMULATOR: '127.0.0.1:8082'
    }
  }
});
