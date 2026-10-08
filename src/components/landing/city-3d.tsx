"use client";
import {useEffect,useMemo,useRef,type RefObject} from "react";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {ContactShadows,Environment,Lightformer,RoundedBox} from "@react-three/drei";
import * as THREE from "three";
import {FitCamera} from "./fit-camera";

const GLASS=new THREE.Color("#5B8DFF"), PAID=new THREE.Color("#10C978"), PAID_GLOW=new THREE.Color("#0A8F55");
const CYCLE=20; // seconds for every window to turn "paid", then restart

type Win={pos:[number,number,number];rot:number;size:[number,number];rank:number};

/** Windows of all buildings share one animation: they turn green one after another, like rents being paid. */
function Windows({wins}:{wins:Win[]}){
  const mats=useRef<THREE.MeshPhysicalMaterial[]>([]);
  const state=useRef<boolean[]>([]);
  useFrame(({clock})=>{
    const p=Math.min(1,(clock.elapsedTime%CYCLE)/(CYCLE*.8));
    mats.current.forEach((m,i)=>{const paid=wins[i].rank<p;if(state.current[i]!==paid){state.current[i]=paid;m.color.copy(paid?PAID:GLASS);m.emissive.copy(paid?PAID_GLOW:new THREE.Color("#000"));m.emissiveIntensity=paid?.45:0;}});
  });
  return <>{wins.map((w,i)=><mesh key={i} position={w.pos} rotation={[0,w.rot,0]} castShadow={false}>
    <boxGeometry args={[w.size[0],w.size[1],.05]}/>
    <meshPhysicalMaterial ref={(m:THREE.MeshPhysicalMaterial|null)=>{if(m)mats.current[i]=m;}} color={GLASS} roughness={.08} metalness={.1} clearcoat={1} clearcoatRoughness={.05} envMapIntensity={2}/>
  </mesh>)}</>;
}

type Spec={x:number;z:number;w:number;d:number;floors:number;cols:[number,number];accent?:boolean;tag?:string;label?:string};
const FH=.62;
type Variant="owner"|"agency";
const SCENES:Record<Variant,{specs:Spec[];ground:[number,number];trees:[number,number,number][];label:string}>={
  owner:{ground:[8.4,7],label:"Immeubles en 3D dont les fenêtres passent au vert à mesure que les loyers sont payés",specs:[
    {x:-1.6,z:-.6,w:2.4,d:2,floors:7,cols:[3,2]},
    {x:1.5,z:-1.2,w:2.2,d:1.8,floors:5,cols:[3,2],accent:true},
    {x:.6,z:1.7,w:1.8,d:1.3,floors:3,cols:[2,2]},
  ],trees:[[2.4,.9,1],[3.3,1.8,.8],[-3.3,1.6,1.1],[-.9,2.1,.7],[3.4,-2.6,.9]]},
  // One building per landlord client of the agency, each with its colour tag.
  agency:{ground:[11.5,8.6],label:"Quartier en 3D : les immeubles de plusieurs propriétaires gérés par une agence",specs:[
    {x:-3.6,z:-1.9,w:2,d:1.8,floors:6,cols:[3,2],tag:"#1557FF",label:"SCI Les Palmiers · 14 lots"},
    {x:-.5,z:-2.4,w:2.2,d:1.6,floors:8,cols:[3,2],tag:"#10C978",label:"M. Houngbédji · 9 lots"},
    {x:2.9,z:-1.7,w:1.9,d:1.8,floors:4,cols:[2,2],tag:"#F59E0B",label:"Mme Dossou · 6 lots"},
    {x:-2.4,z:2,w:1.8,d:1.4,floors:3,cols:[2,2],tag:"#8B5CF6",label:"Famille Agbo · 4 lots"},
    {x:1.7,z:1.9,w:2.4,d:1.4,floors:2,cols:[3,2],tag:"#EC4899",label:"Boutiques Ganhi · 7 lots"},
  ],trees:[[4.9,.5,1],[-5,.4,.9],[.2,.4,.8],[4.8,3.4,.8],[-4.9,3.4,1]]},
};

/** Windows on the two visible faces (+z front, +x side), in a shuffled "payment" order. */
function buildWindows(specs:Spec[]):Win[]{
  let seed=42;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const out:Win[]=[];
  for(const {x,z,w,d,floors,cols} of specs)for(let f=0;f<floors;f++){const y=f*FH+FH*.55;
    for(let c=0;c<cols[0];c++){const gw=w/cols[0];out.push({pos:[x-w/2+gw*(c+.5),y,z+d/2+.02],rot:0,size:[gw*.62,FH*.56],rank:rnd()});}
    for(let c=0;c<cols[1];c++){const gd=d/cols[1];out.push({pos:[x+w/2+.02,y,z+d/2-gd*(c+.5)],rot:Math.PI/2,size:[gd*.6,FH*.56],rank:rnd()});}
  }
  return out;
}

function Building({x,z,w,d,floors,accent=false,tag}:Spec){
  const fh=FH,h=floors*fh+.25;
  const slabs=[];for(let f=1;f<floors;f++)slabs.push(f*fh);
  return <group>
    <RoundedBox args={[w,h,d]} radius={.06} smoothness={4} position={[x,h/2,z]} castShadow receiveShadow>
      <meshStandardMaterial color={accent?"#F2F6FF":"#FFFFFF"} roughness={.55}/>
    </RoundedBox>
    {/* balconies with glass railings on the front face */}
    {slabs.map(y=><group key={y} position={[x,y,z+d/2+.13]}>
      <mesh castShadow receiveShadow><boxGeometry args={[w*.96,.05,.26]}/><meshStandardMaterial color="#FFFFFF" roughness={.5}/></mesh>
      <mesh position={[0,.13,.12]}><boxGeometry args={[w*.94,.22,.02]}/><meshPhysicalMaterial color="#BFD6FF" transparent opacity={.45} roughness={.05} transmission={.4}/></mesh>
    </group>)}
    {/* roof parapet and rooftop block */}
    <mesh position={[x,h+.06,z]} castShadow><boxGeometry args={[w*1.02,.12,d*1.02]}/><meshStandardMaterial color={tag??"#DCE5F7"} roughness={.5}/></mesh>
    <mesh position={[x-w*.2,h+.28,z-d*.15]} castShadow><boxGeometry args={[w*.3,.32,d*.3]}/><meshStandardMaterial color="#C9D6F0" roughness={.6}/></mesh>
  </group>;
}

function Tree({x,z,s=1}:{x:number;z:number;s?:number}){
  return <group position={[x,0,z]} scale={s}>
    <mesh position={[0,.35,0]} castShadow><cylinderGeometry args={[.05,.07,.7,8]}/><meshStandardMaterial color="#6B5B4B" roughness={.9}/></mesh>
    <mesh position={[0,.9,0]} castShadow><icosahedronGeometry args={[.42,1]}/><meshStandardMaterial color="#10C978" roughness={.7} flatShading/></mesh>
    <mesh position={[.15,1.15,.08]} castShadow><icosahedronGeometry args={[.26,1]}/><meshStandardMaterial color="#4ADE9B" roughness={.7} flatShading/></mesh>
  </group>;
}

function Scene({still,variant,labelsRef}:{still:boolean;variant:Variant;labelsRef:RefObject<HTMLDivElement|null>}){
  const cfg=SCENES[variant];
  const group=useRef<THREE.Group>(null);
  const wins=useMemo(()=>buildWindows(cfg.specs),[cfg]);
  const labelSpecs=useMemo(()=>cfg.specs.filter(spec=>spec.label),[cfg]);
  const invalidate=useThree(state=>state.invalidate);
  useEffect(()=>{if(variant==="agency")invalidate();},[invalidate,variant]);
  useFrame(({clock,camera,size})=>{
    const model=group.current,labels=labelsRef.current;
    if(!model)return;
    if(!still)model.rotation.y=-.35+Math.sin(clock.elapsedTime*.18)*.12;
    if(!labels)return;
    model.updateWorldMatrix(true,false);
    camera.updateMatrixWorld();
    labelSpecs.forEach((spec,i)=>{
      const el=labels.children[i] as HTMLElement|undefined;
      if(!el)return;
      const height=spec.floors*FH+.25;
      const point=new THREE.Vector3(spec.x,height+.75,spec.z).applyMatrix4(model.matrixWorld).project(camera);
      el.style.left=`${(point.x*.5+.5)*size.width}px`;
      el.style.top=`${(-point.y*.5+.5)*size.height}px`;
      el.style.visibility=point.z<1?"visible":"hidden";
    });
  });
  return <><group ref={group} rotation={[0,-.35,0]}>
    <RoundedBox args={[cfg.ground[0],.3,cfg.ground[1]]} radius={.14} position={[0,-.15,0]} receiveShadow><meshStandardMaterial color="#EAF1FF" roughness={.8}/></RoundedBox>
    <mesh position={[0,.005,cfg.ground[1]/2-.75]} receiveShadow><boxGeometry args={[cfg.ground[0]-.2,.02,.9]}/><meshStandardMaterial color="#FFFFFF" roughness={.7}/></mesh>
    {variant==='owner'&&<mesh position={[2.6,.005,1.2]} receiveShadow><boxGeometry args={[2.6,.02,2.2]}/><meshStandardMaterial color="#D3F5E5" roughness={.9}/></mesh>}
    {cfg.specs.map((b,i)=><Building key={i} {...b}/>)}
    <Windows wins={wins}/>
    {cfg.trees.map(([x,z,t],i)=><Tree key={i} x={x} z={z} s={t}/>)}
  </group><FitCamera target={group} dir={[11,8.5,12.5]} margin={.9}/></>;
}

export default function City3D({className="",variant="owner"}:{className?:string;variant?:Variant}){
  const still=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const labelsRef=useRef<HTMLDivElement>(null);
  return <div className={`relative overflow-hidden ${className}`} role="img" aria-label={SCENES[variant].label}>
    <Canvas shadows dpr={[1,2]} frameloop={still?"demand":"always"} camera={{position:[11,8.5,12.5],fov:30}} gl={{antialias:true,alpha:true}}>
      <ambientLight intensity={.9}/>
      <hemisphereLight args={["#EAF1FF","#D3F5E5",.7]}/>
      <directionalLight position={[6,10,7]} intensity={2.3} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-.0004}/>
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2} position={[0,6,-6]} scale={[12,4,1]} color="#DCE8FF"/>
        <Lightformer form="rect" intensity={1.2} position={[-6,3,4]} scale={[6,6,1]} color="#FFFFFF"/>
        <Lightformer form="circle" intensity={1.5} position={[6,4,4]} scale={3} color="#C9F7E2"/>
      </Environment>
      <Scene still={still} variant={variant} labelsRef={labelsRef}/>
      <ContactShadows position={[0,-.31,0]} opacity={.35} scale={14} blur={2.6} far={4} color="#0B3FD6"/>
    </Canvas>
    {variant==="agency"&&<div ref={labelsRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {SCENES.agency.specs.filter(spec=>spec.label).map(spec=><div key={spec.label} className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-bold leading-none text-brand-ink shadow-md" style={{visibility:"hidden"}}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{background:spec.tag}}/>{spec.label}
      </div>)}
    </div>}
  </div>;
}
