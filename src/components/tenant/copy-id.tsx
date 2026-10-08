"use client";
import {useState} from "react";import {Check,Copy} from "lucide-react";

export function CopyId({id}:{id:string}){
  const [copied,setCopied]=useState(false);
  const copy=async()=>{try{await navigator.clipboard.writeText(id);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}};
  return <button onClick={copy} className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-dashed border-brand-line bg-brand-mist px-4 py-3 text-left">
    <span className="text-xl font-extrabold tracking-wider text-brand-blue">{id}</span>
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">{copied?<><Check className="h-4 w-4 text-brand-green"/>Copié</>:<><Copy className="h-4 w-4"/>Copier</>}</span>
  </button>;
}
