export const dynamic = "force-dynamic";
import Link from "next/link";
import {PasswordResetFinish} from "@/components/auth/password-recovery";

export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}) {
  const {token,error}=await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[#F6F8FD] p-6"><section className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-8 shadow-sm">
    <Link href="/" className="inline-flex"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="h-9 w-auto"/></Link>
    <h1 className="mt-9 text-3xl font-bold">Nouveau mot de passe</h1>
    {token&&!error?<><p className="mt-2 text-slate-500">Choisissez un nouveau mot de passe pour votre compte.</p><PasswordResetFinish token={token}/></>:<><p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Ce lien est invalide ou expiré.</p><Link href="/mot-de-passe-oublie" className="mt-4 inline-block text-sm font-semibold text-brand-blue">Demander un nouveau lien</Link></>}
  </section></main>;
}
