import {writeFile,mkdir} from 'node:fs/promises';
const bounds={swlat:'30.639',swlng:'-81.447',nelat:'30.669',nelng:'-81.432'};
const common={...bounds,taxon_id:'1',without_taxon_id:'3',quality_grade:'research',captive:'false',per_page:'100',order_by:'observed_on',order:'desc',d2:new Date().toISOString().slice(0,10)};
await mkdir('public/data',{recursive:true});
for(const route of ['observations/species_counts','observations']){
 const url='https://api.inaturalist.org/v1/'+route+'?'+new URLSearchParams(common);
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`iNaturalist ${r.status}`);const data=await r.json();
 const name=route.includes('species')?'species':'observations';
 await writeFile(`/tmp/egans-wildlife-${name}.json`,JSON.stringify({source:url,retrieved:new Date().toISOString(),...data},null,2));
 if(name==='species')await writeFile('public/data/animal-species-counts.json',JSON.stringify({source:url,retrieved:new Date().toISOString(),total_results:data.total_results,results:data.results.map(x=>({count:x.count,taxon:{id:x.taxon.id,name:x.taxon.name,preferred_common_name:x.taxon.preferred_common_name,iconic_taxon_name:x.taxon.iconic_taxon_name}}))},null,2)+'\n');
 console.log(name,data.total_results);
}
