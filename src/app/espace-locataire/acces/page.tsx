export const dynamic = "force-dynamic";
import {TenantShell} from "@/components/tenant-shell";
import {requireTenantPage} from "@/lib/auth/page-access";
export default async function Page(){await requireTenantPage();return <TenantShell><h1 className="text-3xl font-bold">Partage de mon historique</h1><p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Cette fonction sera disponible prochainement. Aucune modification n’est enregistrée ici pour le moment.</p></TenantShell>}
