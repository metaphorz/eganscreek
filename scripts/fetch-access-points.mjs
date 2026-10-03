import {writeFile} from 'node:fs/promises';
const results=[];
for(const q of ['2301 Sadler Road, Fernandina Beach, Florida','Jasmine Street, Fernandina Beach, Florida']){
 const url='https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q,format:'jsonv2',limit:'5'});
 const response=await fetch(url,{headers:{'User-Agent':'EgansCreekAtlas/1.0 (local educational field atlas)'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Geocoder ${response.status}`);
 const data=await response.json();results.push({q,url,retrieved:new Date().toISOString(),data});console.log(q,JSON.stringify(data));
 await new Promise(r=>setTimeout(r,1500));
}
await writeFile('public/data/access-geocoding.json',JSON.stringify(results,null,2)+'\n');
