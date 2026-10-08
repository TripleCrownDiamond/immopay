import {AccessError} from "../db/access";
import {OnboardingError} from "./errors";

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function onboardingErrorResponse(error: unknown): Response {
  if (error instanceof AccessError) return Response.json({error: error.code}, {status: error.code === "UNAUTHENTICATED" ? 401 : 403});
  if (error instanceof OnboardingError) {
    const status = error.code === "USED" || error.code === "ALREADY_LINKED" ? 409
      : error.code === "EXPIRED" || error.code === "REVOKED" ? 410
      : error.code === "EMAIL_MISMATCH" || error.code === "ROLE_CONFLICT" ? 403 : 400;
    return Response.json({error: error.code}, {status});
  }
  throw error;
}
