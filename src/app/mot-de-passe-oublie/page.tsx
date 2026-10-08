import Link from "next/link";
import {PasswordResetRequest} from "@/components/auth/password-recovery";

export default function ForgotPassword() {
  return <main className="grid min-h-screen place-items-center bg-[#F6F8FD] p-6"><section className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-8 shadow-sm">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <h1 className="mt-9 text-3xl font-bold">Mot de passe oublié ?</h1>
    <p className="mt-2 text-slate-500">Saisissez l’email de votre compte pour demander un lien de réinitialisation.</p>
    <PasswordResetRequest/>
    <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Retour à la connexion</Link>
  </section></main>;
}
