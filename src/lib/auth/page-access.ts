import "server-only";
import {redirect, notFound} from "next/navigation";
import {auth} from "./server";
import {AccessError, requireOrganization, requireTenant} from "@/lib/db/access";

export async function requireOwnerPage(): Promise<string> {
  const {data} = await auth.getSession();
  const id = data?.user?.id;
  if (!id) redirect("/login");
  try { await requireOrganization(id); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  return id;
}

export async function requireTenantPage(): Promise<string> {
  const {data} = await auth.getSession();
  const id = data?.user?.id;
  if (!id) redirect("/espace-locataire/connexion");
  try { await requireTenant(id); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  return id;
}
