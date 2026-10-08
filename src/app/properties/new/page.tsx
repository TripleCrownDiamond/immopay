export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
export default async function Page(){await requireOwnerPage();return <AppShell><h1 className="text-3xl font-bold">Ajouter un bien</h1><p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Cette fonction sera disponible prochainement. Aucune modification n’est enregistrée ici pour le moment.</p></AppShell>}
