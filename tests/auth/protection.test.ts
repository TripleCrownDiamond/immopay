import {describe, expect, it, vi} from "vitest";
vi.mock("../../src/lib/auth/server", () => ({auth: {middleware: () => () => undefined}}));
import {config} from "../../src/proxy";

const protectedPaths = [
  "/dashboard", "/properties", "/tenants", "/dues", "/payments",
  "/receipts", "/reports", "/settings", "/espace-locataire",
];

describe("private route matcher", () => {
  it("covers each private area", () => {
    for (const path of protectedPaths) {
      expect(config.matcher.some((pattern: string) => pattern.startsWith(path))).toBe(true);
    }
  });

  it("leaves the marketing and authentication routes public", () => {
    for (const path of ["/", "/login", "/signup", "/signup/agence", "/invitation/token", "/api/auth"]) {
      expect(config.matcher.some((pattern: string) => pattern === path)).toBe(false);
    }
  });
});
