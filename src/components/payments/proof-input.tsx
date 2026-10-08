"use client";
import {useEffect,useState} from "react";import {Paperclip,X} from "lucide-react";

/** Photo or PDF of a payment proof (bank slip, transfer notice, SMS screenshot). */
export function ProofInput({id="proof",label="Preuve de paiement"}:{id?:string;label?:string}){
  const [file,setFile]=useState<File|null>(null);const [url,setUrl]=useState<string|null>(null);
  useEffect(()=>{if(!file||!file.type.startsWith("image/")){setUrl(null);return;}const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u);},[file]);
  return <div>
    <span className="text-sm font-medium">{label}</span>
    {file?<div className="mt-2 flex items-center gap-3 rounded-xl border border-brand-line bg-brand-mist p-3">
      {url?<img src={url} alt="" className="h-14 w-14 rounded-lg object-cover"/>:<span className="grid h-14 w-14 place-items-center rounded-lg bg-white text-xs font-bold text-slate-500">PDF</span>}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
      <button type="button" onClick={()=>setFile(null)} aria-label="Retirer le fichier" className="rounded-lg p-1.5 hover:bg-white"><X className="h-4 w-4"/></button>
    </div>
    :<label htmlFor={id} className="mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-brand-line p-5 text-center text-sm text-slate-500 hover:bg-slate-50">
      <Paperclip className="h-5 w-5 text-brand-blue"/><span><b className="text-brand-blue">Ajouter une photo ou un PDF</b></span><span className="text-xs">Bordereau, avis de virement ou capture du SMS</span>
    </label>}
    <input id={id} type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={e=>setFile(e.target.files?.[0]??null)}/>
  </div>;
}
