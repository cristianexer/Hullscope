import { defineConfig } from '@playwright/test';

const browserName = process.env.HULLSCOPE_BROWSER === 'webkit' ? 'webkit' : 'chromium';
const preview = process.env.HULLSCOPE_PREVIEW === '1';
const port = preview ? 5174 : 5173;
const externalURL = process.env.HULLSCOPE_TEST_URL;
const baseURL = externalURL ?? `http://127.0.0.1:${port}/Hullscope/`;

export default defineConfig({
  testDir: './tests/browser',
  timeout: process.env.CI ? 180000 : 45000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', {open: 'never',outputFolder:process.env.HULLSCOPE_REPORT_DIR??(browserName==='webkit'?'output/playwright/webkit-report':'playwright-report')}]],
  use: {
    baseURL,
    browserName,
    viewport: {width: 1440, height: 1000},
    reducedMotion: process.env.CI ? 'reduce' : undefined,
    channel: process.env.CI || browserName === 'webkit' ? undefined : 'chrome',
    actionTimeout: process.env.CI ? 20000 : 10000,
    screenshot: 'only-on-failure',
    trace: {mode:'retain-on-failure', screenshots:!process.env.CI, snapshots:true, sources:true},
  },
  webServer: externalURL ? undefined : {
    command: `npm run ${preview ? 'preview' : 'dev'} -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
