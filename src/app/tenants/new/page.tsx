export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {TenantForm} from "@/components/tenants/tenant-form";
export default async function Page(){await requireOwnerPage();return <AppShell><h1 className="text-3xl font-bold">Ajouter un locataire</h1><p className="mt-2 text-slate-500">Créez sa fiche, puis partagez-lui un lien pour activer son espace.</p><TenantForm/></AppShell>}
