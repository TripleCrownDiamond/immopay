"use client";
import {useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {Canvas,useFrame,type ThreeElements} from "@react-three/fiber";
import {ContactShadows,Environment,Lightformer,RoundedBox,useTexture} from "@react-three/drei";
import * as THREE from "three";
import {FitCamera} from "./fit-camera";
import {CircleCheck,MessageCircle,type LucideIcon} from "lucide-react";

function phoneBezel(w:number,h:number,innerW:number,innerH:number){
  const outer=new THREE.Shape(),r=.32,x=-w/2,y=-h/2;
  outer.moveTo(x+r,y);outer.lineTo(x+w-r,y);outer.quadraticCurveTo(x+w,y,x+w,y+r);outer.lineTo(x+w,y+h-r);outer.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  outer.lineTo(x+r,y+h);outer.quadraticCurveTo(x,y+h,x,y+h-r);outer.lineTo(x,y+r);outer.quadraticCurveTo(x,y,x+r,y);
  const hole=new THREE.Path(),ir=.26,ix=-innerW/2,iy=-innerH/2;
  hole.moveTo(ix+ir,iy);hole.quadraticCurveTo(ix,iy,ix,iy+ir);hole.lineTo(ix,iy+innerH-ir);hole.quadraticCurveTo(ix,iy+innerH,ix+ir,iy+innerH);
  hole.lineTo(ix+innerW-ir,iy+innerH);hole.quadraticCurveTo(ix+innerW,iy+innerH,ix+innerW,iy+innerH-ir);hole.lineTo(ix+innerW,iy+ir);hole.quadraticCurveTo(ix+innerW,iy,ix+innerW-ir,iy);
  outer.holes.push(hole);
  return new THREE.ShapeGeometry(outer,12);
}

const BODY=<meshPhysicalMaterial color="#1A2145" metalness={.75} roughness={.28} clearcoat={1} clearcoatRoughness={.15}/>;
const ALU={color:"#DCE2EE",metalness:.55,roughness:.32} as const;

function Phone3D({screen,...props}:{screen:string}&ThreeElements["group"]){
  const W=2.3,H=4.85,D=.26;
  const bezel=useMemo(()=>phoneBezel(W,H,2.12,4.66),[]);
  const texture=useTexture(screen);
  texture.colorSpace=THREE.SRGBColorSpace;
  return <group {...props}>
    <RoundedBox args={[W,H,D]} radius={.32} smoothness={6} castShadow>{BODY}</RoundedBox>
    {/* side buttons */}
    <mesh position={[W/2+.012,.9,0]}><boxGeometry args={[.03,.55,.1]}/><meshStandardMaterial color="#2A3360" metalness={.8} roughness={.3}/></mesh>
    <mesh position={[-W/2-.012,1.1,0]}><boxGeometry args={[.03,.35,.1]}/><meshStandardMaterial color="#2A3360" metalness={.8} roughness={.3}/></mesh>
    <mesh position={[0,0,D/2+.004]}><planeGeometry args={[2.12,4.66]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0,0,D/2+.012]} geometry={bezel}><meshBasicMaterial color="#1A2145" side={THREE.DoubleSide}/></mesh>
    {/* dynamic island */}
    <RoundedBox args={[.62,.18,.02]} radius={.08} smoothness={4} position={[0,H/2-.33,D/2+.02]}><meshBasicMaterial color="#05081A"/></RoundedBox>
  </group>;
}

function Laptop3D(props:ThreeElements["group"]){
  const W=7.2,D=4.8;
  const dashboard=useTexture("/demo-screens/dashboard-hero.png");
  dashboard.colorSpace=THREE.SRGBColorSpace;
  return <group {...props}>
    <RoundedBox args={[W,.2,D]} radius={.09} smoothness={4} position={[0,.1,0]} castShadow receiveShadow><meshStandardMaterial {...ALU}/></RoundedBox>
    <mesh position={[0,.205,-.45]}><boxGeometry args={[W*.86,.01,2.3]}/><meshStandardMaterial color="#B9C1D2" roughness={.6}/></mesh>
    <mesh position={[0,.205,1.45]}><boxGeometry args={[2.3,.01,1.35]}/><meshStandardMaterial color="#CBD2E0" roughness={.4} metalness={.4}/></mesh>
    {/* lid hinged on the back edge, opened ~105° */}
    <group position={[0,.2,-D/2+.05]} rotation={[-.26,0,0]}>
      <RoundedBox args={[W,4.6,.13]} radius={.09} smoothness={4} position={[0,2.3,0]} castShadow><meshStandardMaterial {...ALU}/></RoundedBox>
      <mesh position={[0,2.3,.067]}><planeGeometry args={[W-.16,4.44]}/><meshStandardMaterial color="#070B1D" roughness={.3}/></mesh>
      <mesh position={[0,2.3,.072]}><planeGeometry args={[6.7,4.19]}/><meshBasicMaterial map={dashboard} toneMapped={false}/></mesh>
    </group>
  </group>;
}

/** Tilts the scene toward the mouse. The canvas ignores pointer events, so track the window. */
function Parallax({children,amount=.12}:{children:ReactNode;amount?:number}){
  const ref=useRef<THREE.Group>(null);const target=useRef({x:0,y:0});
  useEffect(()=>{const on=(e:PointerEvent)=>{target.current={x:e.clientX/innerWidth*2-1,y:e.clientY/innerHeight*2-1};};addEventListener("pointermove",on);return()=>removeEventListener("pointermove",on);},[]);
  useFrame(()=>{const g=ref.current;if(!g)return;g.rotation.y+=(target.current.x*amount-g.rotation.y)*.05;g.rotation.x+=(target.current.y*amount*.5-g.rotation.x)*.05;});
  return <group ref={ref}>{children}</group>;
}

function Lights(){
  return <>
    <ambientLight intensity={.8}/>
    <directionalLight position={[5,9,8]} intensity={2} castShadow shadow-mapSize={[1024,1024]}/>
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0,5,6]} scale={[10,3,1]} color="#FFFFFF"/>
      <Lightformer form="rect" intensity={2} position={[-7,2,2]} scale={[4,8,1]} color="#CFE0FF"/>
      <Lightformer form="circle" intensity={2} position={[7,3,1]} scale={3} color="#C9F7E2"/>
    </Environment>
  </>;
}

/** Renders only while visible, and stays still for people who prefer reduced motion. */
function Stage({className,camera,children,overlay}:{className:string;camera:{position:[number,number,number];fov:number};children:ReactNode;overlay?:ReactNode}){
  const box=useRef<HTMLDivElement>(null);const [visible,setVisible]=useState(true);
  const still=typeof window!=="undefined"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(()=>{const io=new IntersectionObserver(([e])=>setVisible(e.isIntersecting));if(box.current)io.observe(box.current);return()=>io.disconnect();},[]);
  return <div ref={box} className={`relative isolate overflow-hidden ${className}`}>
    <Canvas shadows dpr={[1,2]} frameloop={!visible?"never":still?"demand":"always"} camera={camera} gl={{antialias:true,alpha:true}}>
      <Lights/>{children}
    </Canvas>
    {overlay}
  </div>;
}

/** Notifications are regular DOM overlays, so React owns their lifecycle. */
function Toast({className,icon:I,color,app,title,body,delay}:{className:string;icon:LucideIcon;color:string;app:string;title:string;body:string;delay:string}){
  return <div className={`pointer-events-none absolute ${className}`} style={{zIndex:16777300}}>
      <div className="anim-pop flex w-[244px] max-w-full gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_20px_40px_-14px_rgba(11,40,140,.4)] backdrop-blur-md" style={{animationDelay:delay}}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{background:color}}><I className="h-5 w-5" strokeWidth={2}/></span>
        <span className="min-w-0 leading-tight"><span className="flex justify-between text-[11px] text-slate-400"><span className="font-semibold">{app}</span><span>maintenant</span></span>
          <b className="mt-0.5 block text-[13px] text-brand-ink">{title}</b><span className="mt-0.5 block text-xs text-slate-500">{body}</span></span>
      </div>
  </div>;
}

export function HeroDevices3D({className=""}:{className?:string}){
  const hero=useRef<THREE.Group>(null);
  // FitCamera frames the devices to fill the canvas at any size, with a small margin so nothing is cut.
  return <Stage className={className} camera={{position:[-.5,3.4,14],fov:30}} overlay={<>
    <Toast className="left-[38%] top-[3%] hidden sm:block" icon={MessageCircle} color="#25D366" app="WhatsApp" title="Rappel envoyé à Paul A." body="44 000 F à régler avant le 05/11" delay="1.1s"/>
    <Toast className="bottom-[15%] left-[7%] hidden sm:block" icon={CircleCheck} color="#10C978" app="ImmoPay" title="Paiement reçu : 110 000 F" body="Via MTN MoMo · quittance envoyée" delay="1.7s"/>
  </>}>
    <Parallax amount={.025}>
      <group ref={hero}>
        <Laptop3D position={[-1.6,0,-.6]} rotation={[0,.3,0]}/>
        <Phone3D position={[2.75,2.5,2]} rotation={[-.05,-.32,.03]} screen="/demo-screens/tenant-home.png"/>
      </group><FitCamera target={hero} dir={[-.03,.24,1]} margin={.86}/>
      <ContactShadows position={[0,-.01,0]} opacity={.35} scale={18} blur={2.4} far={5} color="#0B3FD6"/>
    </Parallax>
  </Stage>;
}

export function TenantPhones3D({className=""}:{className?:string}){
  const phones=useRef<THREE.Group>(null);
  return <Stage className={className} camera={{position:[0,.6,14],fov:30}}>
    <Parallax amount={.1}>
      <group ref={phones}>
        <Phone3D position={[-1.45,-.25,-.8]} rotation={[0,.42,.04]} screen="/demo-screens/receipt-verify.png"/>
        <Phone3D position={[1.5,.2,.4]} rotation={[0,-.38,-.03]} screen="/demo-screens/tenant-receipts.png"/>
      </group><FitCamera target={phones} dir={[0,.05,1]} margin={.9}/>
      <ContactShadows position={[0,-3,0]} opacity={.3} scale={12} blur={2.6} far={4} color="#0B3FD6"/>
    </Parallax>
  </Stage>;
}
