import {readFile,writeFile,mkdir} from 'node:fs/promises';
const input=JSON.parse(await readFile('public/data/animal-species-counts.json','utf8'));
const chosen=[26159,116461,36514,39782,29317,39824,43102,42223,46017,41663,24382,64988,65979,109885,49150,49766,61495,67707,47585,555974];
const groups={Aves:'birds',Reptilia:'reptiles',Mammalia:'mammals',Amphibia:'amphibians',Actinopterygii:'fish',Insecta:'invertebrates',Arachnida:'invertebrates',Mollusca:'invertebrates',Animalia:'invertebrates'};
const headers={'User-Agent':'EgansCreekAtlas/1.0 (educational field atlas)'};
async function json(url){for(let i=0;i<5;i++){try{const r=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});if(r.ok)return r.json();if(r.status!==429)throw Error('HTTP '+r.status);}catch(e){if(i===4)throw e;}await new Promise(r=>setTimeout(r,2500*(i+1)));}throw Error('Rate limited');}
const species=JSON.parse(await readFile('src/data/animals.json','utf8').catch(()=>'{}')).species||[];await mkdir('public/assets/animals',{recursive:true});
for(const id of chosen){
 if(species.some(s=>s.id===String(id)))continue;
 const entry=input.results.find(x=>x.taxon.id===id),t=entry.taxon;
 const url='https://api.inaturalist.org/v1/observations?'+new URLSearchParams({taxon_id:id,photo_license:'cc0,cc-by,cc-by-sa',quality_grade:'research',photos:'true',per_page:'5',order_by:'votes',captive:'false'});
 const data=await json(url),photos=[];
 for(const o of data.results){for(const p of o.photos){if(photos.length===2)break;if(!['cc0','cc-by','cc-by-sa'].includes(p.license_code))continue;
  const remote=p.url.replace('/square.','/medium.');const r=await fetch(remote,{headers});if(!r.ok)continue;const ext=r.headers.get('content-type')?.includes('png')?'png':'jpg';const src=`/assets/animals/${id}-${photos.length+1}.${ext}`;await writeFile('public'+src,Buffer.from(await r.arrayBuffer()));
  photos.push({src,author:p.attribution,license:p.license_code.toUpperCase(),licenseUrl:p.license_code==='cc0'?'https://creativecommons.org/publicdomain/zero/1.0/':`https://creativecommons.org/licenses/${p.license_code.replace('cc-','')}/4.0/`,source:`https://www.inaturalist.org/photos/${p.id}`,observation:`https://www.inaturalist.org/observations/${o.id}`,original:remote,caption:`${t.preferred_common_name||t.name} · species reference photo`});
 }if(photos.length===2)break;}
 if(!photos.length)throw Error('No licensed photo for '+t.name);
 species.push({id:String(id),name:t.preferred_common_name||t.name,scientific:t.name,group:groups[t.iconic_taxon_name],count:entry.count,source:`https://www.inaturalist.org/taxa/${id}`,photos});console.log(t.name,photos.length);
 await writeFile('src/data/animals.json',JSON.stringify({retrieved:input.retrieved,source:input.source,bounds:[[30.639,-81.447],[30.669,-81.432]],species},null,2)+'\n');
 await new Promise(r=>setTimeout(r,1100));
}
await writeFile('src/data/animals.json',JSON.stringify({retrieved:input.retrieved,source:input.source,bounds:[[30.639,-81.447],[30.669,-81.432]],species},null,2)+'\n');
const observations=[],sources=[];
for(const iconic of ['Aves','Reptilia','Mammalia','Amphibia','Actinopterygii','Insecta,Arachnida,Mollusca,Animalia']){
 const query=new URLSearchParams({swlat:'30.639',swlng:'-81.447',nelat:'30.669',nelng:'-81.432',taxon_id:'1',iconic_taxa:iconic,quality_grade:'research',captive:'false',per_page:'50',order_by:'observed_on',order:'desc',license:'cc0,cc-by,cc-by-sa',acc_below:'100',geoprivacy:'open',d2:new Date().toISOString().slice(0,10)});
 const url='https://api.inaturalist.org/v1/observations?'+query;
 const records=await json(url);sources.push({url,available:records.total_results});
 observations.push(...records.results.filter(o=>!o.obscured&&!o.private_geojson&&o.geojson?.type==='Point'&&o.positional_accuracy!==null&&o.positional_accuracy<=100&&['cc0','cc-by','cc-by-sa'].includes(o.license_code)).map(o=>({id:o.id,taxonId:String(o.taxon.id),name:o.taxon.preferred_common_name||o.taxon.name,scientific:o.taxon.name,group:groups[o.taxon.iconic_taxon_name]||'invertebrates',date:o.observed_on,coordinates:o.geojson.coordinates,accuracy:o.positional_accuracy,observer:o.user.login,license:o.license_code,source:`https://www.inaturalist.org/observations/${o.id}`,place:o.place_guess||'Egans Creek area'})));
 await new Promise(r=>setTimeout(r,1100));
}
await writeFile('src/data/animal-observations.json',JSON.stringify({retrieved:new Date().toISOString(),sources,observations:[...new Map(observations.map(o=>[o.id,o])).values()]},null,2)+'\n');console.log('Mapped observations:',observations.length);
