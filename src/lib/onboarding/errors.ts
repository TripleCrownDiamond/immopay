export type OnboardingErrorCode =
  | "INVALID_EMAIL" | "INVALID_NAME" | "INVALID_ID" | "INVALID_TENANT"
  | "ALREADY_LINKED" | "INVALID_INVITATION" | "EXPIRED" | "REVOKED"
  | "USED" | "EMAIL_MISMATCH" | "ROLE_CONFLICT";

export class OnboardingError extends Error {
  constructor(public readonly code: OnboardingErrorCode) {
    super(code);
  }
}

export const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
