export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
import {requireOrganization} from "@/lib/db/access";
export default async function Settings(){const userId=await requireOwnerPage();const org=await requireOrganization(userId);return <AppShell><h1 className="text-3xl font-bold">Paramètres</h1><section className="mt-7 rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold">Mon espace</h2><p className="mt-4 text-sm text-slate-500">Organisation</p><p className="font-semibold">{org.organizationName}</p><p className="mt-4 text-sm text-slate-500">Rôle</p><p className="font-semibold">{org.role==="owner"?"Propriétaire":"Gestionnaire d’agence"}</p><p className="mt-6 text-sm text-slate-500">La modification des paramètres sera disponible prochainement.</p></section></AppShell>}
