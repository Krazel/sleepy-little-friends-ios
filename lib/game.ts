export const ANIMAL_IDS = ['bunny', 'kitten', 'bear'] as const;
export type AnimalId = typeof ANIMAL_IDS[number];
export type Step = 0 | 1 | 2;
export type Progress = Record<AnimalId, Step>;
export type Preferences = { sound: boolean; voice: boolean; motion: boolean };
export type GameState = { view: 'home' | 'room' | 'ending'; room: AnimalId; progress: Progress };
export type GameAction = {type:'open';room:AnimalId} | {type:'act';room:AnimalId;step:Step} | {type:'home'} | {type:'next'} | {type:'reset'};
export const STORAGE_KEY = 'animalitos-a-dormir-v1';
export const DEFAULT_PREFERENCES: Preferences = {sound:true,voice:true,motion:true};
export const freshGame = ():GameState => ({view:'home',room:'bunny',progress:{bunny:0,kitten:0,bear:0}});
export const allAsleep = (progress:Progress) => ANIMAL_IDS.every(id=>progress[id]===2);
export function reduceGame(state:GameState,action:GameAction):GameState {
 switch(action.type) {
  case 'reset': return freshGame();
  case 'home': return {...state,view:'home'};
  case 'open': return ANIMAL_IDS.includes(action.room) ? {...state,view:'room',room:action.room} : state;
  case 'act': {
   if(state.view!=='room'||action.room!==state.room||state.progress[action.room]!==action.step||action.step>=2)return state;
   return {...state,progress:{...state.progress,[action.room]:action.step+1}};
  }
  case 'next': {
   if(state.view!=='room'||state.progress[state.room]!==2)return state;
   if(allAsleep(state.progress))return {...state,view:'ending'};
   const current=ANIMAL_IDS.indexOf(state.room);
   const next=[...ANIMAL_IDS.slice(current+1),...ANIMAL_IDS.slice(0,current+1)].find(id=>state.progress[id]<2)!;
   return {...state,view:'room',room:next};
  }
 }
}
export function restoreSaved(raw:string|null):{game:GameState;preferences:Preferences} {
 const fallback={game:freshGame(),preferences:{...DEFAULT_PREFERENCES}};
 if(!raw)return fallback;
 try {
  const value=JSON.parse(raw);
  if(value?.version!==1)return fallback;
  const progress={...fallback.game.progress};
  for(const id of ANIMAL_IDS) {
   const step=value.progress?.[id];
   if(Number.isInteger(step)&&step>=0&&step<=2)progress[id]=step;
  }
  const preferences={...DEFAULT_PREFERENCES};
  for(const key of ['sound','voice','motion'] as const)if(typeof value.preferences?.[key]==='boolean')preferences[key]=value.preferences[key];
  return {game:{...fallback.game,progress},preferences};
 }catch{return fallback;}
}
export function serializeGame(game:GameState,preferences:Preferences) {
 return JSON.stringify({version:1,progress:game.progress,preferences});
}
export type Point={x:number;y:number};
export type Rect={left:number;top:number;width:number;height:number};
export const actionReady=(lastActionAt:number,now:number)=>now-lastActionAt>=650;
export function acceptsDrop(start:Point,end:Point,target:Rect,scale=1) {
 const distance=Math.hypot(end.x-start.x,end.y-start.y);
 if(distance<=14*scale)return true; // A tap is an equivalent accessible action.
 const pad=38*scale; // Generous toddler-friendly target.
 return end.x>=target.left-pad&&end.x<=target.left+target.width+pad&&end.y>=target.top-pad&&end.y<=target.top+target.height+pad;
}
export function dragOffset(start:Point,end:Point,limit:Rect):Point {
 return {x:Math.max(limit.left,Math.min(end.x,limit.left+limit.width))-start.x,
 y:Math.max(limit.top,Math.min(end.y,limit.top+limit.height))-start.y};
}

