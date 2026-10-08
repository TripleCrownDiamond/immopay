import Link from "next/link";
import {LoginForm} from "@/components/auth/login-form";

export default function TenantLogin() {
  return <main className="grid min-h-screen place-items-center bg-[#F6F8FD] p-6"><section className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-8 shadow-sm">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <p className="mt-9 text-sm font-bold text-brand-blue">Espace locataire</p>
    <h1 className="mt-2 text-3xl font-bold">Retrouvez vos loyers</h1>
    <p className="mt-2 text-slate-500">Connectez-vous pour voir vos échéances et vos quittances.</p>
    <LoginForm tenant/>
    <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Connexion propriétaire ou agence</Link>
  </section></main>;
}
