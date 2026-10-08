import {getPool} from "@/lib/db/pool";
export default async function Verify({params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const clean=code.trim();
  const result=clean.length>0&&clean.length<=80?await getPool().query(`SELECT public_code AS code,amount::text AS amount,
    to_char(issued_at AT TIME ZONE 'UTC','DD/MM/YYYY') AS "issuedOn"
    FROM receipts WHERE public_code=$1 LIMIT 1`,[clean]):{rows:[]};
  const receipt=result.rows[0] as {code:string;amount:string;issuedOn:string}|undefined;
  return <main className="grid min-h-screen place-items-center bg-[#F6F7FA] p-5"><section className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-sm"><img src="/brand/immopay-logo.png" alt="ImmoPay" className="inline-block h-9 w-auto"/>
    <div className={`mx-auto mt-8 grid h-16 w-16 place-items-center rounded-full text-3xl ${receipt?"bg-emerald-50 text-emerald-600":"bg-amber-50 text-amber-600"}`}>{receipt?"✓":"?"}</div>
    <h1 className="mt-5 text-2xl font-bold">{receipt?"Quittance authentique":"Quittance introuvable"}</h1>
    <p className="mt-2 text-sm text-slate-500">{receipt?"Cette quittance est enregistrée par ImmoPay.":"Aucune quittance ne correspond à cette référence."}</p>
    {receipt&&<dl className="mt-7 space-y-3 rounded-2xl bg-slate-50 p-5 text-left text-sm"><div className="flex justify-between"><dt>Référence</dt><dd className="font-medium">{receipt.code}</dd></div><div className="flex justify-between"><dt>Montant</dt><dd className="font-medium">{new Intl.NumberFormat("fr-FR").format(Number(receipt.amount))} F</dd></div><div className="flex justify-between"><dt>Émise le</dt><dd className="font-medium">{receipt.issuedOn}</dd></div></dl>}
  </section></main>;
}
