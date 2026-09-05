"use client";
/* oxlint-disable nextjs/no-img-element -- Native image dimensions are required for the CSS sprite-atlas crops. */

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowRight, Heart, House, Moon, Music2, Play, RotateCcw, Settings2, Sparkles, Volume2, VolumeX, X, Hand, Download } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ANIMAL_IDS, DEFAULT_PREFERENCES, STORAGE_KEY, acceptsDrop, actionReady, allAsleep, dragOffset, freshGame, reduceGame, restoreSaved, serializeGame, type AnimalId, type GameAction, type GameState, type Point, type Preferences } from '@/lib/game';
import { ANIMALS, type Animal, type Crop } from '@/lib/animals';
import { BedtimeAudio } from '@/lib/audio';

type InstallPrompt=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type ModelContext={registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};

function Sprite({id,crop,className='',style={},alt=''}:{id:AnimalId;crop:Crop;className?:string;style?:CSSProperties;alt?:string}) {
 return <span className={'sprite '+className} style={{aspectRatio:crop.width+'/'+crop.height,...style}}>
  <img src={'/art/'+id+'.png'} alt={alt} draggable={false} style={{width:(1024/crop.width*100)+'%',maxWidth:'none',left:(-crop.x/crop.width*100)+'%',top:(-crop.y/crop.height*100)+'%'}}/>
 </span>;
}
function Portrait({animal,sleeping=false}:{animal:Animal;sleeping?:boolean}) {
 const x=animal.face.x*1024-185,y=animal.face.y*animal.room.height-185;
 return <span className={'portrait '+(sleeping?'is-sleeping':'')}><Sprite id={animal.id} crop={{x,y,width:370,height:370}}/><span className="portrait-moon" aria-hidden="true"><Moon size={17} fill="currentColor"/></span></span>;
}
function Room({animal,step,onAction,onNext,onHint,motion}:{animal:Animal;step:0|1|2;onAction:()=>void;onNext:()=>void;onHint:()=>void;motion:boolean}) {
 const roomRef=useRef<HTMLDivElement>(null);
 const dragging=useRef<{pointerId:number;start:Point;origin:Point;width:number}|null>(null);
 const [ghost,setGhost]=useState<{x:number;y:number;width:number}|null>(null);
 const [ready,setReady]=useState(false);
 const sleeping=step===2;
 useEffect(()=>{if(sleeping){const t=setTimeout(()=>setReady(true),motion?1900:200);return()=>clearTimeout(t);}},[sleeping,motion]);
 useEffect(()=>{const cancel=()=>{dragging.current=null;setGhost(null);};window.addEventListener('blur',cancel);return()=>window.removeEventListener('blur',cancel);},[]);
 const start=(e:PointerEvent<HTMLButtonElement>)=>{
  if(step!==0||dragging.current||!e.isPrimary||e.button!==0)return;
  e.preventDefault();
  const r=e.currentTarget.getBoundingClientRect();
  dragging.current={pointerId:e.pointerId,start:{x:e.clientX,y:e.clientY},origin:{x:r.left+r.width/2,y:r.top+r.height/2},width:r.width};
  setGhost({x:r.left+r.width/2,y:r.top+r.height/2,width:r.width});
  e.currentTarget.setPointerCapture(e.pointerId);
 };
 const move=(e:PointerEvent<HTMLButtonElement>)=>{
  const d=dragging.current;if(!d||d.pointerId!==e.pointerId)return;
  const delta=dragOffset(d.start,{x:e.clientX,y:e.clientY},{left:0,top:0,width:window.innerWidth,height:window.innerHeight});
  setGhost({x:d.origin.x+delta.x,y:d.origin.y+delta.y,width:d.width});
 };
 const end=(e:PointerEvent<HTMLButtonElement>)=>{
  const d=dragging.current;if(!d||d.pointerId!==e.pointerId)return;
  const r=roomRef.current?.getBoundingClientRect();
  dragging.current=null;setGhost(null);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(r&&acceptsDrop(d.start,{x:e.clientX,y:e.clientY},{left:r.left+r.width*.18,top:r.top+r.height*.34,width:r.width*.65,height:r.height*.60},Math.max(.8,r.width/400)))onAction();
 };
 const cancel=()=>{dragging.current=null;setGhost(null);};
 const targetStyle:CSSProperties=animal.id==='kitten'&&step===1?{left:'75%',top:'32%',width:'23%',height:'24%'}:{left:'26%',top:step===1?'32%':'49%',width:'48%',height:step===1?'32%':'39%'};
 return <section className={'room-screen '+(sleeping?'asleep':'')+' '+(motion?'':'still')} aria-label={'La habitación de '+animal.name}>
  <div className="room-art" ref={roomRef}>
   <Sprite id={animal.id} crop={animal.room} className="room-background" alt={animal.name+' en su habitación'}/>
   {step>0&&<div className={'placed-prop placed-'+animal.id} style={{left:animal.placed.x*100+'%',top:animal.placed.y*100+'%',width:animal.placed.width*100+'%'}}><Sprite id={animal.id} crop={animal.prop}/></div>}
   <div className="night-shade"/>
   {step<2&&<button className={'scene-target '+(step===0?'drop-target':'')} style={targetStyle} aria-label={animal.actionLabels[step as 0|1]} onClick={onAction}>{step===0?<span className="target-heart"><Heart size={26}/></span>:animal.id==='kitten'?<span className="tap-ring"/>:animal.id==='bunny'?<span className="kiss-hint"><Heart fill="currentColor"/></span>:<span className="music-hint"><Music2/></span>}</button>}
   {sleeping&&<div className="sleep-marks" aria-hidden="true"><span>z</span><span>z</span><span>z</span></div>}
   {step>0&&<div key={animal.id+'-'+step} className="mimo-hearts" aria-hidden="true"><Heart/><Heart/><Heart/></div>}
   <span className="room-name">{sleeping?<Moon size={16}/>:<Heart size={16}/>} {animal.name}</span>
  </div>
  <div className="activity-tray">
   {step===0?<><span className="tray-flourish" aria-hidden="true"><Sparkles size={19}/></span>
    <button className={'prop-button prop-'+animal.id+(ghost?' dragging':'')} aria-label={animal.actionLabels[0]} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} onLostPointerCapture={cancel} onClick={e=>{if(e.detail===0)onAction();}}>
     <Sprite id={animal.id} crop={animal.prop}/><span className="drag-hand" aria-hidden="true"><Hand size={26}/></span>
    </button><span className="tray-flourish" aria-hidden="true"><Sparkles size={19}/></span></>
    :step===1?<button className={'round-action action-'+animal.id} onClick={onAction} aria-label={animal.actionLabels[1]}>{animal.id==='bunny'?<Heart fill="currentColor"/>:animal.id==='kitten'?<Moon fill="currentColor"/>:<Music2/>}</button>
    :<div className="sleep-message"><Moon size={25}/><span>Dulces sueños,<br/><strong>{animal.name}</strong></span></div>}
  </div>
  <footer className="room-footer">
   {sleeping?<button className="next-button" onClick={onNext} disabled={!ready} aria-label="Continuar con las buenas noches"><span>{ready?'Seguimos':'Shhh…'}</span><ArrowRight/></button>:<><span className="instruction" aria-live="polite">{animal.instructions[step]}</span><button className="hint-button" onClick={onHint} aria-label="Escuchar la pista"><Volume2 size={20}/></button></>}
  </footer>
  {ghost&&<div className="drag-ghost" aria-hidden="true" style={{left:ghost.x,top:ghost.y,width:ghost.width}}><Sprite id={animal.id} crop={animal.prop}/></div>}
 </section>;
}

export default function Home() {
 const [game,setGame]=useState<GameState>(freshGame);
 const gameRef=useRef(game);
 const [preferences,setPreferences]=useState<Preferences>(DEFAULT_PREFERENCES);
 const [hydrated,setHydrated]=useState(false);
 const [parents,setParents]=useState(false);
 const [assetStatus,setAssetStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [loadAttempt,setLoadAttempt]=useState(0);
 const [installPrompt,setInstallPrompt]=useState<InstallPrompt|null>(null);
 const [offlineReady,setOfflineReady]=useState(false);
 const [storageIssue,setStorageIssue]=useState(false);
 const [systemReduced,setSystemReduced]=useState(false);
 const audio=useRef<BedtimeAudio|null>(null);
 const lastActionAt=useRef(-Infinity);
 const motion=preferences.motion&&!systemReduced;

 useEffect(()=>{
  audio.current=new BedtimeAudio();
  // oxlint-disable-next-line react/react-compiler -- Hydrate browser-only storage after the server's first render.
  try{const saved=restoreSaved(localStorage.getItem(STORAGE_KEY));gameRef.current=saved.game;setGame(saved.game);setPreferences(saved.preferences);}catch{setStorageIssue(true);}
  setHydrated(true);
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setSystemReduced(media.matches);change();media.addEventListener('change',change);
  const visibility=()=>{if(document.hidden)audio.current?.stop();};
  document.addEventListener('visibilitychange',visibility);
  const install=(e:Event)=>{e.preventDefault();setInstallPrompt(e as InstallPrompt);};
  const installed=()=>setInstallPrompt(null);
  window.addEventListener('beforeinstallprompt',install);window.addEventListener('appinstalled',installed);
  if('serviceWorker' in navigator&&process.env.NODE_ENV==='production'){
   navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>setOfflineReady(true)).catch(()=>{});
  }
  return()=>{audio.current?.dispose();media.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeinstallprompt',install);window.removeEventListener('appinstalled',installed);};
 },[]);
 useEffect(()=>{
  let active=true;
  Promise.all(ANIMAL_IDS.map(id=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src='/art/'+id+'.png';}))).then(()=>{if(active)setAssetStatus('ready');}).catch(()=>{if(active)setAssetStatus('error');});
  return()=>{active=false;};
 },[loadAttempt]);
 useEffect(()=>{
  audio.current?.configure(preferences);
  // oxlint-disable-next-line react/react-compiler -- Report an external browser storage failure to the parent options.
  if(hydrated){try{localStorage.setItem(STORAGE_KEY,serializeGame(game,preferences));}catch{setStorageIssue(true);}}
 },[game,preferences,hydrated]);
 const send=(action:GameAction)=>{
  const next=reduceGame(gameRef.current,action);
  gameRef.current=next;setGame(next);return next;
 };
 const activate=()=>{void audio.current?.unlock();};
 const open=(id:AnimalId)=>{
  lastActionAt.current=-Infinity;
  activate();audio.current?.cancelSpeech();send({type:'open',room:id});
  const animal=ANIMALS[id],step=gameRef.current.progress[id];
  audio.current?.speak(step===2?animal.goodnight:animal.instructions[step],350);
 };
 const action=()=>{
  const current=gameRef.current;if(current.view!=='room')return false;
  const step=current.progress[current.room];if(step===2||!actionReady(lastActionAt.current,Date.now()))return false;
  lastActionAt.current=Date.now();
  activate();const animal=ANIMALS[current.room];
  send({type:'act',room:current.room,step});
  if(step===0){audio.current?.chime();audio.current?.speak(animal.instructions[1],900);}
  else{audio.current?.lullaby();audio.current?.speak(animal.goodnight,750);}
  return true;
 };
 const goHome=()=>{audio.current?.stop();send({type:'home'});};
 const nextRoom=()=>{
  lastActionAt.current=-Infinity;
  audio.current?.stop();activate();
  const next=send({type:'next'});
  if(next.view==='ending'){audio.current?.lullaby();audio.current?.speak('Ya están todos dormiditos. Buenas noches. Hasta mañana.',650);}
  else audio.current?.speak(ANIMALS[next.room].instructions[next.progress[next.room] as 0|1],450);
 };
 const reset=()=>{audio.current?.stop();send({type:'reset'});setParents(false);};
 const toggleSound=()=>{const sound=!preferences.sound;setPreferences({...preferences,sound});audio.current?.configure({...preferences,sound});if(sound){void audio.current?.unlock().then(()=>audio.current?.touch());}};
 const updatePreference=(key:keyof Preferences,value:boolean)=>setPreferences(p=>({...p,[key]:value}));
 useEffect(()=>{
  const context=(document as unknown as {modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const schema={type:'object',properties:{},additionalProperties:false};
  const validateEmpty=(input:unknown)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');};
  const settled=async()=>{await new Promise<void>(resolve=>setTimeout(resolve,0));return {view:gameRef.current.view,room:gameRef.current.room,progress:{...gameRef.current.progress}};};
  const tools=[
   {name:'read_bedtime_progress',description:'Read which animals are tucked in or asleep in this device’s current bedtime game.',inputSchema:schema,annotations:{readOnlyHint:true,untrustedContentHint:false},execute:(input:unknown)=>{validateEmpty(input);return settled();}},
   {name:'open_animal_room',description:'Open one existing animal room. Does not complete its bedtime actions.',inputSchema:{type:'object',properties:{animal:{type:'string',enum:ANIMAL_IDS}},required:['animal'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='animal')||!ANIMAL_IDS.includes((input as {animal:AnimalId}).animal))throw new Error('Choose bunny, kitten or bear.');open((input as {animal:AnimalId}).animal);return settled();}},
   {name:'complete_current_bedtime_action',description:'Perform exactly the current visible bedtime action, placing the prop or settling the selected animal to sleep.',inputSchema:schema,annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input:unknown)=>{validateEmpty(input);if(gameRef.current.view!=='room'||gameRef.current.progress[gameRef.current.room]===2)throw new Error('Open a room with an unfinished bedtime action.');action();return settled();}}
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  return()=>lifecycle.abort();
  // Registry calls read current state through refs.
 },[]);

 const finished=allAsleep(game.progress);
 const animal=ANIMALS[game.room];
 const step=game.progress[game.room];
 const playable=hydrated&&assetStatus==='ready';
 return <main className={'game-shell '+(game.view==='room'?'playing':'')+' '+(game.view==='ending'?'ending-shell':'')+' '+(!motion?'reduce-motion':'')}>
  <header className="topbar">
   {game.view==='home'?<span className="brand"><Moon size={20}/> Buenas noches</span>:<button className="icon-button" onClick={goHome} aria-label="Volver a las habitaciones"><House size={22}/></button>}
   {game.view==='room'&&<span className="topbar-name">{animal.name}<small>{animal.kind}</small></span>}
   {game.view==='ending'&&<span className="topbar-name">Hasta mañana</span>}
   <button className="icon-button sound-button" aria-label={preferences.sound?'Silenciar el juego':'Activar el sonido'} aria-pressed={preferences.sound} onClick={toggleSound}>{preferences.sound?<Volume2 size={22}/>:<VolumeX size={22}/>}</button>
  </header>

  {game.view==='home'&&<section className="welcome">
   <span className="little-moon" aria-hidden="true"><Moon size={36} fill="currentColor"/><Sparkles size={17}/></span>
   <h1>Animalitos<br/><em>a dormir</em></h1>
   <p className="welcome-line">{finished?'Todos sueñan contigo.':'¿Les damos las buenas noches?'}</p>
   <div className="animal-cards">
    {ANIMAL_IDS.map((id,i)=><button key={id} className={'animal-card card-'+id} disabled={!playable} onClick={()=>open(id)} aria-label={'Visitar a '+ANIMALS[id].name+(game.progress[id]===2?', ya está durmiendo':'')} style={{'--card-color':ANIMALS[id].color,'--order':i} as CSSProperties}>
     <div className="card-room"><Sprite id={id} crop={ANIMALS[id].room}/><div className="card-gradient"/></div>
     <div className="card-caption"><span>{ANIMALS[id].name}</span><small>{ANIMALS[id].kind}</small></div>
     <span className={'card-state '+(game.progress[id]===2?'done':'')}>{game.progress[id]===2?<Moon size={18} fill="currentColor"/>:<Heart size={18}/>}</span>
    </button>)}
   </div>
   {assetStatus==='error'?<div className="asset-notice" role="alert"><p>No pudimos abrir las habitaciones.</p><button className="primary-button" onClick={()=>{setAssetStatus('loading');setLoadAttempt(n=>n+1);}}><RotateCcw/> Volver a intentar</button></div>:
    <button className="primary-button" disabled={!playable} onClick={()=>{if(finished){activate();send({type:'open',room:'bunny'});send({type:'next'});audio.current?.lullaby();}else open(ANIMAL_IDS.find(id=>game.progress[id]<2)!);}}>{!playable?<Moon className="loading-moon"/>:finished?<Moon fill="currentColor"/>:<Play fill="currentColor"/>}{!playable?'Preparando sus camitas…':finished?'Buenas noches':ANIMAL_IDS.some(id=>game.progress[id]>0)?'Seguimos':'A dormir'}</button>}
   <span className="welcome-footnote"><Heart size={14}/> Un mimo, un abrazo y a soñar.</span>
  </section>}

  {game.view==='room'&&<Room key={game.room} animal={animal} step={step} onAction={action} onNext={nextRoom} onHint={()=>{activate();audio.current?.speak(step<2?animal.instructions[step as 0|1]:animal.goodnight,0);}} motion={motion}/>}

  {game.view==='ending'&&<section className="ending">
   <div className="ending-moon"><Moon size={96} strokeWidth={1.2} fill="currentColor"/><Sparkles size={28}/></div>
   <span className="eyebrow">SHHH…</span><h1>Buenas<br/><em>noches</em></h1>
   <p>Ya están todos dormiditos.<br/>Ahora toca descansar.</p>
   <div className="sleeping-friends">{ANIMAL_IDS.map(id=><button key={id} onClick={()=>open(id)} aria-label={'Ver dormir a '+ANIMALS[id].name}><Portrait animal={ANIMALS[id]} sleeping/><span>{ANIMALS[id].name}</span></button>)}</div>
   <button className="quiet-button" onClick={goHome}><House size={18}/> Sus habitaciones</button>
  </section>}

  <footer className="app-footer">
   {game.view==='room'?<nav aria-label="Habitaciones">{ANIMAL_IDS.map(id=><button key={id} onClick={()=>open(id)} aria-current={game.room===id?'page':undefined} aria-label={'Habitación de '+ANIMALS[id].name+(game.progress[id]===2?', dormido':'')}><Portrait animal={ANIMALS[id]} sleeping={game.progress[id]===2}/></button>)}</nav>:<span className="footer-moon"><Moon size={16}/> A su ritmo, con cariño.</span>}
   <button className="parents-button" aria-label="Opciones para mayores" onClick={()=>{audio.current?.stop();setParents(true);}}><Settings2 size={17}/><span>Para mayores</span></button>
  </footer>

  <Dialog open={parents} onOpenChange={setParents}>
   <DialogContent className="parents-dialog" showCloseButton={false}>
    <DialogClose className="icon-button dialog-close" aria-label="Cerrar opciones"><X size={21}/></DialogClose>
    <DialogTitle className="parents-title">Un ratito juntos</DialogTitle>
    <DialogDescription className="parents-description">Un juego para acompañar a los más pequeños. Tocad o arrastrad los objetos y despedíos de cada animalito.</DialogDescription>
    <div className="setting-row"><label htmlFor="sound-setting">Sonidos suaves<small>Campanitas y una pequeña nana</small></label><Switch id="sound-setting" checked={preferences.sound} onCheckedChange={value=>updatePreference('sound',value)}/></div>
    <div className="setting-row"><label htmlFor="voice-setting">Pistas habladas<small>Voz en español, si el dispositivo dispone de ella</small></label><Switch id="voice-setting" checked={preferences.voice} onCheckedChange={value=>updatePreference('voice',value)}/></div>
    <div className="setting-row"><label htmlFor="motion-setting">Animaciones suaves<small>{systemReduced?'Tu dispositivo prefiere reducir el movimiento.':'Mimos, corazones y pequeños movimientos'}</small></label><Switch id="motion-setting" checked={preferences.motion&&!systemReduced} disabled={systemReduced} onCheckedChange={value=>updatePreference('motion',value)}/></div>
    <p className="privacy-note">Sin anuncios ni compras. El juego guarda las camitas solo en este dispositivo. {storageIssue?'El navegador no permite guardar el progreso. Puedes seguir jugando.':''}</p>
    {installPrompt?<button className="install-button" onClick={async()=>{try{await installPrompt.prompt();await installPrompt.userChoice;}catch{}setInstallPrompt(null);}}><Download size={19}/> Instalar el juego</button>:<p className="install-note">Para tenerlo a mano: en el menú del navegador elige «Añadir a pantalla de inicio». {offlineReady?'El juego ya está preparado para abrirse sin conexión.':'Ábrelo una vez con conexión para guardar las habitaciones.'}</p>}
    <button className="reset-button" onClick={reset}><RotateCcw size={18}/> Preparar otra noche</button>
   </DialogContent>
  </Dialog>
 </main>;
}

