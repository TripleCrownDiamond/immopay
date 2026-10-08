import {authClient} from "./client";

export const RESET_NOTICE = "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.";

export async function requestResetPublicMessage(emailInput: string, origin: string): Promise<string> {
  const email = emailInput.trim().toLowerCase();
  const result = await authClient.requestPasswordReset({email, redirectTo: `${origin}/reinitialiser-mot-de-passe`});
  if (result.error && (result.error.status ?? 0) >= 500) throw new Error("AUTH_UNAVAILABLE");
  return RESET_NOTICE;
}
