export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const metresToFeet=m=>m/0.3048;
export const tideLevel=(hour,range=1.83)=>range/2*(1-Math.cos(hour/12.42*2*Math.PI));
export function interpolate(points,time,maxGap=12*60000){
 if(!points.length||time<points[0].t||time>points.at(-1).t)return null;
 const exact=points.find(p=>p.t===time); if(exact)return exact.v;
 let right=points.findIndex(p=>p.t>time); if(right<1)return null;
 const a=points[right-1],b=points[right]; if(b.t-a.t>maxGap)return null;
 return a.v+(b.v-a.v)*(time-a.t)/(b.t-a.t);
}
export function depth(water,bed){if(water.datum!==bed.datum)throw Error('Vertical datums must match');return Math.max(0,water.value-bed.value);}
export function parseNOAA(json,product){
 if(json.error)throw Error(json.error.message||'NOAA could not provide this series.');
 const rows=product==='predictions'?json.predictions:json.data;
 if(!Array.isArray(rows))throw Error('No series was returned.');
 return rows.filter(r=>r.v!==''&&r.v!=null&&Number.isFinite(Number(r.v))).map(r=>({t:Date.parse(r.t.replace(' ','T')+'Z'),v:Number(r.v),quality:r.q||null,flags:r.f||null})).filter(r=>Number.isFinite(r.t)).sort((a,b)=>a.t-b.t);
}
export function eastTime(time){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(time));}
export function validateNotebook(input){
 if(input?.version!==1||!Array.isArray(input.entries)||input.entries.length>2000)throw Error('Choose a valid atlas notebook (version 1, up to 2,000 entries).');
 return input.entries.map(e=>{
  if(typeof e.species!=='string'||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!['Certain','Likely','Unsure'].includes(e.confidence))throw Error('A notebook entry has invalid fields.');
  return {id:typeof e.id==='string'?e.id:crypto.randomUUID(),species:e.species.slice(0,80),date:e.date,confidence:e.confidence,place:String(e.place||'').slice(0,100),notes:String(e.notes||'').slice(0,2000)};
 });
}
export function csvExport(entries){const cell=x=>'"'+String(x??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';return ['date,species,confidence,place,notes',...entries.map(e=>[e.date,e.species,e.confidence,e.place,e.notes].map(cell).join(','))].join('\r\n');}
