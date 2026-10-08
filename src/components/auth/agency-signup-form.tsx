"use client";
import {useEffect, useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/client";

export function AgencySignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [sessionEmail,setSessionEmail] = useState("");
  const [agencyNameValue,setAgencyNameValue] = useState("");
  useEffect(()=>{
    void authClient.getSession().then(result=>{
      if (result.data?.user?.email) {setSessionEmail(result.data.user.email);setAccountCreated(true);}
    });
    try {const pending=JSON.parse(sessionStorage.getItem("pendingAgencySignup")??"null") as {agencyName?:string}|null;if(pending?.agencyName)setAgencyNameValue(pending.agencyName);} catch {}
  },[]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError(""); setNotice("");
    try {
      const form = new FormData(event.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const agencyName = agencyNameValue.trim();
      const email = (sessionEmail || String(form.get("email") ?? "")).trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      if (!accountCreated) {
        const result = await authClient.signUp.email({name, email, password});
        if (result.error) {setError(result.error.message ?? "Impossible de créer le compte."); return;}
        setAccountCreated(true);
        sessionStorage.setItem("pendingAgencySignup",JSON.stringify({email,agencyName}));
      }
      let response: Response | undefined;
      for (let attempt=0; attempt<3; attempt++) {
        try {response = await fetch("/api/account/agency", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({agencyName})});}
        catch {if (attempt===2) throw new Error("AGENCY_UNAVAILABLE");}
        if (response && response.status<500) break;
        await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
      }
      if (!response) throw new Error("AGENCY_UNAVAILABLE");
      if (response.status === 401) {setNotice("Compte créé. Vérifiez votre email, puis reconnectez-vous pour ouvrir votre agence."); return;}
      if (!response.ok) {setError(response.status===403?"Ce compte possède déjà un autre espace ImmoPay.":"Compte créé, mais l’agence n’a pas pu être configurée. Réessayez sans recréer le compte."); return;}
      sessionStorage.removeItem("pendingAgencySignup");
      router.replace("/dashboard"); router.refresh();
    } catch {setError("La création du compte a échoué. Réessayez.");}
    finally {setPending(false);}
  }
  return <form className="mt-7 grid gap-4" onSubmit={submit}>
    {sessionEmail?<p className="text-sm text-slate-600">Compte connecté : <b>{sessionEmail}</b></p>:<label className="text-sm font-medium">Votre nom<input name="name" required autoComplete="name" className="mt-2 w-full rounded-xl border p-3.5"/></label>}
    <label className="text-sm font-medium">Nom de l’agence<input name="agencyName" value={agencyNameValue} onChange={event=>setAgencyNameValue(event.target.value)} required minLength={2} maxLength={120} className="mt-2 w-full rounded-xl border p-3.5"/></label>
    {!sessionEmail&&<><label className="text-sm font-medium">Email professionnel<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border p-3.5"/></label>
    <label className="text-sm font-medium">Mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-2 w-full rounded-xl border p-3.5"/></label></>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <button disabled={pending} className="rounded-xl bg-indigo-600 p-3.5 font-semibold text-white disabled:opacity-60">{pending?"Création…":accountCreated?"Terminer la création":"Créer mon agence"}</button>
  </form>;
}
