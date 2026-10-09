export type SignupFlash = {
  kind: "owner" | "agency" | "tenant" | "agency_manager";
  email: string;
  step: "created" | "verify_email" | "finish_setup";
};

const key = "immopay.signup-flash.v1";
const kinds: SignupFlash["kind"][] = ["owner", "agency", "tenant", "agency_manager"];
const steps: SignupFlash["step"][] = ["created", "verify_email", "finish_setup"];

function parseSignupFlash(value: unknown): SignupFlash | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (!kinds.includes(item.kind as SignupFlash["kind"]) ||
      !steps.includes(item.step as SignupFlash["step"]) ||
      typeof item.email !== "string" ||
      item.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) return null;
  return {kind: item.kind as SignupFlash["kind"], email: item.email, step: item.step as SignupFlash["step"]};
}

export function rememberSignupFlash(value: SignupFlash): void {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled. */ }
}

export function takeSignupFlash(): SignupFlash | null {
  try {
    const raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return raw ? parseSignupFlash(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
