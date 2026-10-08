import Link from "next/link";
import Image from "next/image";
import {LoginForm} from "@/components/auth/login-form";

export default function Login() {
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="grid place-items-center p-6"><div className="w-full max-w-md">
      <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
      <h1 className="mt-12 text-3xl font-bold">Heureux de vous revoir</h1>
      <p className="mt-2 text-slate-500">Connectez-vous pour retrouver vos biens et vos loyers.</p>
      <LoginForm/>
      <p className="mt-6 text-center text-sm text-slate-500">Pas encore de compte ? <Link href="/signup" className="font-semibold text-indigo-600">Créer un compte</Link></p>
      <Link href="/espace-locataire/connexion" className="mt-4 block rounded-xl border border-brand-line bg-white p-3.5 text-center text-sm font-semibold text-brand-blue">Vous êtes locataire ? Accéder à mon espace</Link>
    </div></section>
    <section className="relative hidden items-end overflow-hidden p-10 text-white lg:flex">
      <Image src="/images/login-courtyard.jpg" alt="" fill priority sizes="50vw" className="object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[#26160f]/90 via-[#3b2419]/40 to-transparent"/>
      <div className="relative z-10 max-w-md pb-8"><p className="font-semibold text-amber-100">ImmoPay</p><h2 className="mt-4 text-5xl font-bold leading-tight">Vos loyers, sans le chaos.</h2><p className="mt-5 text-amber-50/90">Une seule vue pour savoir ce qui est encaissé, ce qui reste et ce qui nécessite votre attention.</p></div>
    </section>
  </main>;
}
