import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const sandbox={window:{},Blob,TextEncoder,TextDecoder,Uint8Array,DataView,URL,setTimeout};
runInNewContext(readFileSync(new URL('./backup.js',import.meta.url),'utf8'),sandbox);
const {zip,readZip}=sandbox.window.PawDaysBackup;
const enc=new TextEncoder(),dec=new TextDecoder();
const bytes=async entries=>new Uint8Array(await zip(entries).arrayBuffer());
const record={name:'records.json',data:enc.encode('{"pets":[],"version":1}')};
const photo={name:'photos/pet-1.jpg',data:new Uint8Array([0xff,0xd8,0xff,0xd9])};
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name)}
const archive=await bytes([record,photo]);
const unpacked=readZip(archive);
const duplicate=await bytes([record,record]);
const invalid=await bytes([record,{name:'../escape.txt',data:new Uint8Array([42])}]);
const corrupt=archive.slice();corrupt[44]^=1;
const photoOnly=await bytes([photo]);

test('records JSON round-trip',()=>assert.equal(dec.decode(unpacked.get('records.json')),dec.decode(record.data)));
test('photo byte round-trip',()=>assert.deepEqual([...unpacked.get('photos/pet-1.jpg')],[...photo.data]));
test('reject empty ZIP',()=>assert.throws(()=>readZip(new Uint8Array())));
test('reject truncated ZIP',()=>assert.throws(()=>readZip(archive.slice(0,-2))));
test('reject missing records',()=>assert.throws(()=>readZip(photoOnly)));
test('reject duplicate paths',()=>assert.throws(()=>readZip(duplicate)));
test('reject invalid paths',()=>assert.throws(()=>readZip(invalid)));
test('reject CRC mismatch',()=>assert.throws(()=>readZip(corrupt)));
console.log('All',passed,'checks passed');
