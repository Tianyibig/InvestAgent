import { defineConfig } from "@playwright/test";

// Uses the installed Microsoft Edge instead of downloading Chromium: the
// Playwright browser cache is empty here and the CDN is not reachable.
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /invest\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    // Launched through PowerShell because webServer.env is not forwarded to the
    // spawned shell on Windows, and the workspace route needs auth-disabled.
    command: "powershell -NoProfile -ExecutionPolicy Bypass -File ../../scripts/e2e_server.ps1",
    url: "http://127.0.0.1:3101/invest",
    timeout: 180_000,
    reuseExistingServer: false,
    // The workbench lives inside the authenticated workspace shell; the demo
    // server runs with the harness's own auth-disabled user.
    env: { DEER_FLOW_AUTH_DISABLED: "1" },
  },
});
