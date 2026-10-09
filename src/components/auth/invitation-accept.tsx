"use client";
import {useEffect, useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";
import {rememberSignupFlash} from "@/lib/feedback/signup-flash";

export function InvitationAccept({token,kind}:{token:string;kind:"tenant"|"agency_manager"}) {
  const router=useRouter();
  const [accountEmail,setAccountEmail]=useState("");
  const [mode,setMode]=useState<"signup"|"signin">("signup");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  useEffect(()=>{void authClient.getSession().then(result=>setAccountEmail(result.data?.user?.email??""));},[]);

  async function activate(email=accountEmail,created=false) {
    const response=await fetch("/api/invitations/accept",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});
    if (response.status===401) {if (created) rememberSignupFlash({kind,email,step:"verify_email"});setMode("signin");setNotice(created?`Compte créé pour ${email}. Vérifiez votre email si nécessaire, puis connectez-vous ici pour accepter l’invitation.`:"Reconnectez-vous pour accepter cette invitation.");return;}
    if (!response.ok) {
      const body=await response.json().catch(()=>({})) as {error?:string};
      setError(body.error==="EMAIL_MISMATCH"?"Connectez-vous avec l’adresse indiquée dans l’invitation.":body.error==="ROLE_CONFLICT"?"Ce compte possède déjà un autre type d’espace ImmoPay.":"Ce lien ne peut plus être activé. Demandez-en un nouveau.");
      return;
    }
    const {destination}=await response.json() as {destination:string};
    if (created) rememberSignupFlash({kind,email,step:"created"});
    router.replace(destination); router.refresh();
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setNotice("");
    try {
      const form=new FormData(event.currentTarget);
      const email=String(form.get("email")??"").trim().toLowerCase();
      const password=String(form.get("password")??"");
      const name=String(form.get("name")??"").trim();
      const result=mode==="signup"?await authClient.signUp.email({email,password,name}):await authClient.signIn.email({email,password});
      if (result.error) {setError(result.error.message??"La connexion a échoué.");return;}
      setAccountEmail(email);
      if (mode==="signup") rememberSignupFlash({kind,email,step:"created"});
      await activate(email,mode==="signup");
    } catch {setError("Impossible d’activer l’invitation. Réessayez.");}
    finally {setPending(false);}
  }

  async function acceptCurrent() {
    setPending(true); setError(""); setNotice("");
    try {await activate();} catch {setError("Impossible d’activer l’invitation. Réessayez.");}
    finally {setPending(false);}
  }

  return <div className="mt-7">
    {accountEmail&&<div className="mb-6 rounded-xl bg-brand-mist p-4 text-sm"><p>Connecté avec <b>{accountEmail}</b></p><button onClick={acceptCurrent} disabled={pending} className="mt-3 rounded-lg bg-brand-blue px-4 py-2 font-semibold text-white disabled:opacity-60">Accepter avec ce compte</button></div>}
    <div className="flex gap-2 text-sm"><button type="button" onClick={()=>setMode("signup")} className={`rounded-lg px-3 py-2 ${mode==="signup"?"bg-brand-mist font-bold text-brand-blue":"text-slate-500"}`}>Créer mon compte</button><button type="button" onClick={()=>setMode("signin")} className={`rounded-lg px-3 py-2 ${mode==="signin"?"bg-brand-mist font-bold text-brand-blue":"text-slate-500"}`}>J’ai déjà un compte</button></div>
    <form onSubmit={submit} className="mt-4 grid gap-4">
      {mode==="signup"&&<label className="text-sm font-medium">Nom complet<input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border p-3"/></label>}
      <label className="text-sm font-medium">Email invité<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3"/></label>
      <label className="text-sm font-medium">Mot de passe<input name="password" type="password" minLength={8} required autoComplete={mode==="signup"?"new-password":"current-password"} className="mt-2 w-full rounded-xl border p-3"/></label>
      {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <button disabled={pending} className="rounded-xl bg-brand-blue p-3 font-semibold text-white disabled:opacity-60">{pending?"Activation…":mode==="signup"?"Créer et accepter":"Se connecter et accepter"}</button>
    </form>
  </div>;
}
