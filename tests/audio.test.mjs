import test from 'node:test';
import assert from 'node:assert/strict';
import {BedtimeAudio} from '../lib/audio.ts';
await test('muting stops scheduled tones and narration; reenabling works',async()=>{
 let stopped=0,cancelled=0,created=0;
 class Context {
  state='suspended';currentTime=0;destination={};
  createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createOscillator(){created++;return {frequency:{value:0},connect(){},disconnect(){},start(){},stop(){stopped++;}};}
  async resume(){this.state='running';}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
 }
 globalThis.window={AudioContext:Context,speechSynthesis:{cancel(){cancelled++;},getVoices(){return[];},speak(){}}};
 globalThis.document={hidden:false};
 const audio=new BedtimeAudio();await audio.unlock();audio.lullaby();
 assert.equal(created,12);
 audio.configure({sound:false,voice:true,motion:true});assert.ok(stopped>=24);assert.ok(cancelled>0);
 audio.chime();assert.equal(created,12);
 audio.configure({sound:true,voice:false,motion:true});await audio.unlock();audio.chime();assert.equal(created,15);
 audio.dispose();delete globalThis.window;delete globalThis.document;
});
await test('missing audio and voice support does not break gameplay feedback',async()=>{
 globalThis.window={};globalThis.document={hidden:false};
 const audio=new BedtimeAudio();await audio.unlock();audio.chime();audio.speak('Buenas noches');audio.dispose();
 delete globalThis.window;delete globalThis.document;
});

