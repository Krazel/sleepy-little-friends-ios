import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
for(const id of ['bunny','kitten','bear'])await test(id+' is a complete RGBA sprite sheet',async()=>{
 const data=await readFile('public/art/'+id+'.png');
 assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data.readUInt32BE(16),1024);assert.equal(data.readUInt32BE(20),1536);assert.equal(data[25],6);assert.ok(data.length>100000);
});
await test('install manifest is self-contained and Spanish',async()=>{
 const m=JSON.parse(await readFile('public/manifest.webmanifest','utf8'));
 assert.equal(m.lang,'es');assert.equal(m.start_url,'/');assert.equal(m.display,'standalone');assert.equal(m.icons[0].src,'/favicon.svg');
});

