import Link from "next/link";
import {AgencySignupForm} from "@/components/auth/agency-signup-form";

export default function AgencySignup() {
  return <main className="grid min-h-screen place-items-center bg-[#F6F7FA] p-6"><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <p className="mt-9 text-sm font-bold text-brand-blue">Pour les agences</p>
    <h1 className="mt-2 text-3xl font-bold">Créer l’espace de mon agence</h1>
    <p className="mt-2 text-slate-500">Centralisez vos biens, vos locataires et votre équipe.</p>
    <AgencySignupForm/>
    <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link href="/login" className="font-semibold text-indigo-600">Se connecter</Link></p>
  </section></main>;
}
