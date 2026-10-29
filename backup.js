/* PawDays backup archive helper. No external network requests. */
(function(){
'use strict';
function crc32(bytes){
 let c=0xffffffff;
 for(const byte of bytes){c^=byte;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}
 return (c^0xffffffff)>>>0;
}
function zip(entries){
 if(entries.length>65535)throw Error('單次備份檔案數量過多');
 const encoder=new TextEncoder(),body=[],central=[];
 let offset=0,centralSize=0;
 for(const entry of entries){
  const name=encoder.encode(entry.name),data=entry.data;
  if(!(data instanceof Uint8Array)||name.length>65535||data.length>0xffffffff)throw Error('備份檔案格式不正確');
  const crc=crc32(data),local=new Uint8Array(30+name.length),view=new DataView(local.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);
  view.setUint16(10,0,true);view.setUint16(12,0x21,true);
  view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);
  view.setUint16(26,name.length,true);local.set(name,30);
  const header=new Uint8Array(46+name.length),h=new DataView(header.buffer);
  h.setUint32(0,0x02014b50,true);h.setUint16(4,20,true);h.setUint16(6,20,true);
  h.setUint16(8,0x0800,true);h.setUint16(12,0,true);h.setUint16(14,0x21,true);
  h.setUint32(16,crc,true);h.setUint32(20,data.length,true);h.setUint32(24,data.length,true);
  h.setUint16(28,name.length,true);h.setUint32(42,offset,true);header.set(name,46);
  body.push(local,data);central.push(header);
  offset+=local.length+data.length;centralSize+=header.length;
 }
 const end=new Uint8Array(22),d=new DataView(end.buffer);
 d.setUint32(0,0x06054b50,true);d.setUint16(8,entries.length,true);d.setUint16(10,entries.length,true);
 d.setUint32(12,centralSize,true);d.setUint32(16,offset,true);
 return new Blob([...body,...central,end],{type:'application/zip'});
}
/* Strict reader for PawDays-generated STORE-only ZIP archives.
   Rejects encrypted, compressed, oversized, duplicate and path-traversal entries. */
function readZip(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>60*1024*1024)throw Error('備份檔超過安全上限（60 MB）');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);
 const valid=(pos,len)=>pos>=0&&len>=0&&pos+len<=bytes.length;
 let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){
  if(valid(p,22)&&u32(p)===0x06054b50&&p+22+u16(p+20)===bytes.length){end=p;break}
 }
 if(end<0||u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))throw Error('ZIP 目錄格式不正確');
 const count=u16(end+10),size=u32(end+12),offset=u32(end+16);
 if(!count||count>501||!valid(offset,size)||offset+size!==end)throw Error('ZIP 目錄超出允許範圍');
 const names=new Set(),entries=new Map(),decoder=new TextDecoder('utf-8',{fatal:true});
 let position=offset,total=0;
 for(let i=0;i<count;i++){
  if(!valid(position,46)||u32(position)!==0x02014b50)throw Error('ZIP 目錄項目損毀');
  const flags=u16(position+8),method=u16(position+10),crc=u32(position+16),compressed=u32(position+20),expanded=u32(position+24),n=u16(position+28),extra=u16(position+30),comment=u16(position+32),local=u32(position+42);
  if(flags!==0x0800||method!==0||compressed!==expanded||!valid(position,46+n+extra+comment))throw Error('僅接受 PawDays 產生的未壓縮 ZIP');
  const name=decoder.decode(bytes.subarray(position+46,position+46+n));
  if(names.has(name)||!(name==='records.json'||/^photos\/[a-zA-Z0-9-]{1,128}\.(jpg|png|webp)$/.test(name)))throw Error('包含重複或不允許的備份路徑');
  names.add(name);
  if(!valid(local,30)||u32(local)!==0x04034b50||u16(local+6)!==flags||u16(local+8)!==method)throw Error('照片區塊格式不一致');
  const ln=u16(local+26),le=u16(local+28),start=local+30+ln+le;
  if(!valid(local,30+ln+le)||!valid(start,expanded)||decoder.decode(bytes.subarray(local+30,local+30+ln))!==name||u32(local+14)!==crc||u32(local+18)!==expanded||u32(local+22)!==expanded)throw Error('ZIP 檔案位置或大小不正確');
  const payload=bytes.subarray(start,start+expanded);
  if(crc32(payload)!==crc)throw Error('備份檔 CRC 校驗失敗，可能已損毀');
  if(name==='records.json'&&expanded>2*1024*1024)throw Error('文字紀錄超過 2 MB 安全上限');
  if(name!=='records.json'&&expanded>5*1024*1024)throw Error('單張照片超過 5 MB 安全上限');
  total+=expanded;
  if(total>52*1024*1024)throw Error('解壓縮總量超過安全上限');
  entries.set(name,payload);
  position+=46+n+extra+comment;
 }
 if(position!==end||!entries.has('records.json'))throw Error('ZIP 目錄不完整');
 return entries;
}

function download(blob,filename){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
window.PawDaysBackup=Object.freeze({zip,readZip,download});
})();
