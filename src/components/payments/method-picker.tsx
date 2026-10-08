"use client";
import {methods,type OfflineMethod} from "@/lib/demo/payments";

export function MethodPicker({value,onChange,exclude=[]}:{value:OfflineMethod;onChange:(m:OfflineMethod)=>void;exclude?:OfflineMethod[]}){
  return <fieldset><legend className="text-sm font-medium">Moyen de paiement</legend>
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{methods.filter(m=>!exclude.includes(m.id)).map(({id,label,hint,icon:I})=><label key={id} className={`cursor-pointer rounded-xl border p-3 text-sm ${value===id?"border-brand-blue bg-brand-mist ring-1 ring-brand-blue":"border-brand-line bg-white hover:bg-slate-50"}`}>
      <input type="radio" name="method" value={id} checked={value===id} onChange={()=>onChange(id)} className="sr-only"/>
      <I className="h-5 w-5 text-brand-blue" strokeWidth={1.75}/><b className="mt-1.5 block">{label}</b><span className="text-xs text-slate-500">{hint}</span>
    </label>)}</div>
  </fieldset>;
}
