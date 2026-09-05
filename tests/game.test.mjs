import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMAL_IDS,DEFAULT_PREFERENCES,freshGame,reduceGame,restoreSaved,serializeGame,acceptsDrop,dragOffset,allAsleep} from '../lib/game.ts';
const act=(s)=>reduceGame(s,{type:'act',room:s.room,step:s.progress[s.room]});
await test('complete six-action bedtime journey reaches a real ending',()=>{
 let s=freshGame();assert.equal(s.view,'home');
 s=reduceGame(s,{type:'open',room:'bunny'});
 for(const id of ANIMAL_IDS){assert.equal(s.room,id);s=act(s);assert.equal(s.progress[id],1);s=act(s);assert.equal(s.progress[id],2);s=reduceGame(s,{type:'next'});}
 assert.equal(s.view,'ending');assert.ok(allAsleep(s.progress));
});
await test('animals can be visited and completed in any order',()=>{
 let s=freshGame();
 for(const id of ['bear','bunny','kitten']){s=reduceGame(s,{type:'open',room:id});s=act(act(s));}
 assert.equal(reduceGame(s,{type:'next'}).view,'ending');
});
await test('next selects an unfinished animal and wraps around',()=>{
 let s=reduceGame(freshGame(),{type:'open',room:'bear'});s=act(act(s));
 assert.equal(reduceGame(s,{type:'next'}).room,'bunny');
});
await test('next cannot skip an unfinished routine',()=>{
 const s=reduceGame(freshGame(),{type:'open',room:'kitten'});assert.equal(reduceGame(s,{type:'next'}),s);
});
await test('stale repeated pointer events do not advance a second step',()=>{
 let s=reduceGame(freshGame(),{type:'open',room:'bunny'});const event={type:'act',room:'bunny',step:0};s=reduceGame(s,event);assert.equal(reduceGame(s,event),s);
});
await test('sleeping animals cannot accumulate more actions',()=>{
 let s=reduceGame(freshGame(),{type:'open',room:'bear'});s=act(act(s));assert.equal(act(s),s);
});
await test('a late event from a previous room is ignored',()=>{
 const s=reduceGame(freshGame(),{type:'open',room:'kitten'});assert.equal(reduceGame(s,{type:'act',room:'bunny',step:0}),s);
});
await test('no bedtime action happens on home screen',()=>{
 const s=freshGame();assert.equal(reduceGame(s,{type:'act',room:'bunny',step:0}),s);
});
await test('home and reload retain all partial progress and preferences',()=>{
 let s=reduceGame(freshGame(),{type:'open',room:'bunny'});s=act(s);s=reduceGame(s,{type:'home'});
 const preferences={sound:false,voice:false,motion:false};
 const restored=restoreSaved(serializeGame(s,preferences));assert.deepEqual(restored.game.progress,{bunny:1,kitten:0,bear:0});assert.deepEqual(restored.preferences,preferences);assert.equal(restored.game.view,'home');
});
await test('malformed local storage is recovered safely',()=>{
 for(const raw of [null,'','not json','null','{}','{"version":2}'])assert.deepEqual(restoreSaved(raw).game,freshGame());
});
await test('hostile or invalid stored fields cannot alter game rules',()=>{
 const restored=restoreSaved('{"version":1,"progress":{"bunny":999,"kitten":"2","bear":-1},"preferences":{"sound":"false","voice":false,"motion":null}}');
 assert.deepEqual(restored.game.progress,freshGame().progress);assert.deepEqual(restored.preferences,{sound:true,voice:false,motion:true});
});
await test('reset creates independent new progress objects',()=>{
 const s=freshGame();s.progress.bunny=2;const reset=reduceGame(s,{type:'reset'});assert.deepEqual(reset.progress,{bunny:0,kitten:0,bear:0});assert.equal(s.progress.bunny,2);
});
await test('a short tap completes the prop action without precision dragging',()=>{
 assert.ok(acceptsDrop({x:100,y:400},{x:105,y:401},{left:100,top:100,width:150,height:150}));
});
await test('dragging onto the body or just outside it is accepted',()=>{
 const target={left:100,top:100,width:150,height:150};
 assert.ok(acceptsDrop({x:100,y:400},{x:170,y:180},target));
 assert.ok(acceptsDrop({x:100,y:400},{x:90,y:180},target));
});
await test('a distant drop is rejected and can be retried',()=>{
 const target={left:100,top:100,width:150,height:150};
 assert.equal(acceptsDrop({x:100,y:400},{x:350,y:480},target),false);
 assert.ok(acceptsDrop({x:100,y:400},{x:160,y:150},target));
});
await test('drag visual cannot travel outside the viewport',()=>{
 assert.deepEqual(dragOffset({x:50,y:50},{x:-200,y:800},{left:0,top:0,width:390,height:700}),{x:-50,y:650});
});
await test('invalid room id is ignored',()=>{
 const s=freshGame();assert.equal(reduceGame(s,{type:'open',room:'dragon'}),s);
});
await test('default settings enable optional feedback',()=>assert.deepEqual(DEFAULT_PREFERENCES,{sound:true,voice:true,motion:true}));

import {actionReady} from '../lib/game.ts';
await test('transition cooldown prevents toddler double-taps from skipping the second action',()=>{assert.equal(actionReady(1000,1200),false);assert.equal(actionReady(1000,1650),true);assert.equal(actionReady(-Infinity,0),true);});
