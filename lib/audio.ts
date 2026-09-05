import type { Preferences } from './game';
export class BedtimeAudio {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private nodes=new Set<OscillatorNode>();
 private prefs:Preferences={sound:true,voice:true,motion:true};
 private speechTimer:ReturnType<typeof setTimeout>|null=null;
 configure(prefs:Preferences) {
  this.prefs=prefs;
  if(!prefs.sound)this.stop();
  if(!prefs.voice)this.cancelSpeech();
 }
 async unlock() {
  if(!this.prefs.sound)return;
  try {
   const AudioConstructor=window.AudioContext || (window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!AudioConstructor)return;
   if(!this.context) {
    this.context=new AudioConstructor();
    this.master=this.context.createGain();
    this.master.gain.value=.16;
    this.master.connect(this.context.destination);
   }
   if(this.context.state==='suspended')await this.context.resume();
  }catch{/* Gameplay always works when audio is unavailable. */}
 }
 private tone(frequency:number,offset:number,duration:number,volume=.3) {
  const context=this.context;
  if(!context||!this.master||!this.prefs.sound||context.state!=='running')return;
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  const t=context.currentTime+offset;
  oscillator.type='sine';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,t);
  gain.gain.linearRampToValueAtTime(volume,t+.035);
  gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  oscillator.connect(gain);gain.connect(this.master);
  oscillator.start(t);oscillator.stop(t+duration+.05);
  this.nodes.add(oscillator);
  oscillator.onended=()=>{this.nodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
 }
 chime(){this.tone(523.25,0,.5);this.tone(659.25,.16,.65);this.tone(783.99,.33,.8,.18);}
 touch(){this.tone(392,0,.3,.2);}
 lullaby() {
  const notes=[392,392,440,392,523.25,493.88,392,392,440,392,587.33,523.25];
  let offset=0;
  notes.forEach((note,i)=>{const d=i%6===5?1.35:.62;this.tone(note,offset,d,.20);offset+=d*.82;});
 }
 speak(text:string,delay=120) {
  this.cancelSpeech();
  if(!this.prefs.sound||!this.prefs.voice||!('speechSynthesis' in window))return;
  this.speechTimer=setTimeout(()=>{
   if(document.hidden||!this.prefs.sound||!this.prefs.voice)return;
   try {
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang='es-ES';utterance.rate=.82;utterance.pitch=1.15;utterance.volume=.65;
    const voices=window.speechSynthesis.getVoices();
    utterance.voice=voices.find(v=>v.lang==='es-ES'&&v.localService)||voices.find(v=>v.lang.startsWith('es'))||null;
    window.speechSynthesis.speak(utterance);
   }catch{/* Optional narration; instructions remain visual. */}
  },delay);
 }
 cancelSpeech(){if(this.speechTimer)clearTimeout(this.speechTimer);this.speechTimer=null;if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();}
 stop(){this.cancelSpeech();for(const node of this.nodes){try{node.stop();}catch{}}this.nodes.clear();void this.context?.suspend().catch(()=>{});}
 dispose(){this.stop();void this.context?.close().catch(()=>{});this.context=null;}
}

