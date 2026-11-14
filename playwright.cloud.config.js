import { defineConfig, devices } from '@playwright/test';

// Testes da UI PÚBLICA, sem emulador e sem alterar dados operacionais existentes.
// Este arquivo NÃO é carregado pelo CI de regressão habitual.
export default defineConfig({
  testDir:'./e2e',
  testMatch:'cloud-planning-live.spec.js',
  fullyParallel:false,
  workers:1,
  retries:0,
  forbidOnly:!!process.env.CI,
  timeout:210000,
  expect:{timeout:30000},
  outputDir:'test-results-cloud',
  reporter:[['list'],['html',{outputFolder:'playwright-report-cloud',open:'never'}]],
  use:{
    ...devices['Desktop Chrome'],
    baseURL:'https://controle-climatizacao-3cre.vercel.app/',
    screenshot:'only-on-failure',
    trace:'retain-on-failure',
    actionTimeout:30000,
    navigationTimeout:45000
  }
});
