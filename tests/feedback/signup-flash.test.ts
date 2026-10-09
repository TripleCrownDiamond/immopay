import {afterEach, expect, test, vi} from "vitest";
import {rememberSignupFlash, takeSignupFlash} from "../../src/lib/feedback/signup-flash";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {values.set(key, value);},
    removeItem: (key: string) => {values.delete(key);},
  };
}

afterEach(() => vi.unstubAllGlobals());

test("signup feedback is read once and malformed data is ignored", () => {
  const sessionStorage = storage();
  vi.stubGlobal("sessionStorage", sessionStorage);
  const flash = {kind: "owner", email: "test@example.com", step: "verify_email"} as const;
  rememberSignupFlash(flash);
  expect(takeSignupFlash()).toEqual(flash);
  expect(takeSignupFlash()).toBeNull();
  sessionStorage.setItem("immopay.signup-flash.v1", "not json");
  expect(takeSignupFlash()).toBeNull();
});
