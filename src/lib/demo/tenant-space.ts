// Demo data for the tenant space, matching the other static screens of the app.
export type Rental={id:string;landlord:string;unit:string;city:string;rent:number;from:string;to?:string};
export type TenantReceipt={code:string;rentalId:string;period:string;amount:number;paidOn:string;onTime:boolean};
export type AccessRequest={id:string;landlord:string;unit:string;requestedOn:string;status:"pending"|"approved"|"declined";expiresOn?:string};

export const tenant={name:"Paul Adjovi",phone:"+229 97 •• •• 56",immopayId:"IMP-7K3F9Q",since:"mars 2024"};

export const rentals:Rental[]=[
  {id:"r2",landlord:"Résidence Les Cocotiers",unit:"Appartement A03",city:"Cotonou, Fidjrossè",rent:110000,from:"2025-11-01"},
  {id:"r1",landlord:"M. Houngbédji",unit:"Studio 4",city:"Abomey-Calavi",rent:60000,from:"2024-03-01",to:"2025-10-31"},
];

const months=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
function build(rentalId:string,from:[number,number],to:[number,number],amount:number,late:string[]):TenantReceipt[]{
  const out:TenantReceipt[]=[];let [y,m]=from;
  while(y<to[0]||(y===to[0]&&m<=to[1])){
    const period=`${months[m-1]} ${y}`, key=`${y}-${m}`;
    const onTime=!late.includes(key);
    out.push({code:`IMP-${String(y).slice(2)}-${String(m).padStart(2,"0")}${rentalId==="r1"?"S4":"A3"}`,rentalId,period,amount,paidOn:`${onTime?"0"+(2+(m%3)):"1"+(2+(m%5))}/${String(m).padStart(2,"0")}/${y}`,onTime});
    m++;if(m>12){m=1;y++;}
  }
  return out.reverse();
}
export const receipts:TenantReceipt[]=[
  ...build("r2",[2025,11],[2026,9],110000,[]),
  ...build("r1",[2024,3],[2025,10],60000,["2024-8","2025-2"]),
];

export const currentDue={period:"octobre 2026",amount:110000,paid:66000,dueOn:"05/11/2026"};

export const requests:AccessRequest[]=[
  {id:"q1",landlord:"Immeuble Le Baobab",unit:"Appartement 2B",requestedOn:"06/10/2026",status:"pending"},
  {id:"q0",landlord:"Résidence Les Cocotiers",unit:"Appartement A03",requestedOn:"10/09/2026",status:"approved",expiresOn:"09/12/2026"},
];

export function summary(rs:TenantReceipt[]=receipts){
  const onTime=rs.filter(r=>r.onTime).length;
  return {total:rs.length,onTime,late:rs.length-onTime,rate:Math.round(onTime/rs.length*100),rentals:rentals.length};
}

export const fcfa=(n:number)=>`${n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g," ")} F`;
