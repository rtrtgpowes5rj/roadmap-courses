import { copyFileSync, mkdirSync } from "fs";
import path from "path";

import { defineConfig, devices } from "@playwright/test";

// E2E runs against its own server, port and data directory so it never touches
// data/store.json or a dev server that is already running on 3100.
const E2E_PORT = 3210;
const E2E_DATA_DIR = path.join(__dirname, ".e2e-data");

// Seed the data directory before the web server's first request, otherwise the
// server would generate (and migrate) the legacy seed instead of the fixture.
mkdirSync(E2E_DATA_DIR, { recursive: true });
copyFileSync(path.join(__dirname, "tests", "fixtures", "store.json"), path.join(E2E_DATA_DIR, "store.json"));

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  // All specs share one data directory; run them one at a time.
  workers: 1,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: `cmd /c .\\run-dev.cmd -p ${E2E_PORT}`,
    url: `http://127.0.0.1:${E2E_PORT}/view/edtechlab-main-map`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      CATALOG_DATA_DIR: E2E_DATA_DIR,
      NEXT_DIST_DIR: ".next-e2e"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
