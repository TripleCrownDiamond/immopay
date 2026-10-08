import "server-only";
import {createNeonAuth} from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {secret: process.env.NEON_AUTH_COOKIE_SECRET!},
});

export async function requireSession(): Promise<string> {
  const {data} = await auth.getSession();
  const userId = data?.user?.id;
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
