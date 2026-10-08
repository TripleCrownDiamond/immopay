export const dynamic = "force-dynamic";
import {AppShell} from "@/components/app-shell";
import {requireOwnerPage} from "@/lib/auth/page-access";
export default async function Messages(){await requireOwnerPage();return <AppShell><h1 className="text-3xl font-bold">Messages & relances</h1><p className="mt-7 rounded-2xl bg-white p-6 text-slate-500">Les relances automatiques seront disponibles prochainement. Aucune séquence n’est active pour le moment.</p></AppShell>}
