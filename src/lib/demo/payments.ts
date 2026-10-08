// Demo data for offline payments (bank transfer, bank deposit, cash, cheque, Mobile Money outside ImmoPay).
import {Banknote,Building,FileSignature,Landmark,Smartphone,type LucideIcon} from "lucide-react";

export type OfflineMethod="bank_transfer"|"bank_deposit"|"cash"|"cheque"|"mobile_money";
export const methods:{id:OfflineMethod;label:string;hint:string;icon:LucideIcon}[]=[
  {id:"bank_transfer",label:"Virement bancaire",hint:"Avis de virement ou relevé",icon:Landmark},
  {id:"bank_deposit",label:"Dépôt en banque",hint:"Bordereau de versement",icon:Building},
  {id:"mobile_money",label:"Mobile Money direct",hint:"Capture du SMS de confirmation",icon:Smartphone},
  {id:"cash",label:"Espèces",hint:"Remis en main propre",icon:Banknote},
  {id:"cheque",label:"Chèque",hint:"Numéro du chèque",icon:FileSignature},
];
export const methodLabel=(m:OfflineMethod)=>methods.find(x=>x.id===m)!.label;

export type Declared={id:string;tenant:string;unit:string;method:OfflineMethod;amount:number;date:string;reference:string;note?:string};
export const declared:Declared[]=[
  {id:"d1",tenant:"Mariam A.",unit:"Appartement C1",method:"bank_deposit",amount:95000,date:"07/10/2026",reference:"BORD-48213",note:"Versement Ecobank agence Ganhi"},
  {id:"d2",tenant:"Jean K.",unit:"Boutique B2",method:"bank_transfer",amount:40000,date:"06/10/2026",reference:"VIR-IMP-JK2B",note:"Solde loyer d’octobre"},
];

export const payoutAccounts=[
  {kind:"bank",label:"Ecobank Bénin",holder:"Georges A.",number:"BJ066 01001 00123456789 21",icon:Landmark},
  {kind:"mobile_money",label:"MTN Mobile Money",holder:"Georges A.",number:"+229 01 97 00 00 00",icon:Smartphone},
] as const;

// Open dues of the selected tenant, oldest first (used to preview how a payment is allocated).
export const openDues=[
  {id:"due-sep",label:"Septembre 2026",amountExpected:95000,amountPaid:60000},
  {id:"due-oct",label:"Octobre 2026",amountExpected:95000,amountPaid:0},
  {id:"due-nov",label:"Novembre 2026",amountExpected:95000,amountPaid:0},
];
export const tenantsForPayment=["Mariam A. · Appartement C1","Jean K. · Boutique B2","Aïcha S. · Appartement A3"];
