import Link from "next/link";
import {SignupForm} from "@/components/auth/signup-form";

export default function Signup() {
  return <main className="grid min-h-screen place-items-center bg-[#F6F7FA] p-6"><section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <h1 className="mt-10 text-3xl font-bold">Créez votre espace ImmoPay</h1>
    <p className="mt-2 text-slate-500">Commencez gratuitement et ajoutez votre premier bien en quelques minutes.</p>
    <SignupForm/>
    <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link href="/login" className="font-semibold text-indigo-600">Se connecter</Link></p>
  </section></main>;
}
