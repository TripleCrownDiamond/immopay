import {defineConfig} from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3002", browserName: "chromium", channel: "chrome"},
  timeout: 60_000,
  retries: 1,
  reporter: "list",
});
