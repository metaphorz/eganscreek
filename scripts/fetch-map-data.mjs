import {writeFile,mkdir} from 'node:fs/promises';
const base='https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer';
await mkdir('public/data',{recursive:true});
for(const layer of [6,9,12]){
 const query=new URLSearchParams({where:"gnis_name LIKE '%Egan%'",geometry:'-81.49,30.61,-81.41,30.72',geometryType:'esriGeometryEnvelope',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'*',returnGeometry:'true',outSR:'4326',f:'geojson'});
 const url=`${base}/${layer}/query?${query}`;
 const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`USGS ${r.status}`);
 const data=await r.json();if(data.error)throw Error(JSON.stringify(data.error));
 data.metadata={source:`${base}/${layer}`,query:url,retrieved:new Date().toISOString(),license:'USGS public domain',purpose:'Mapped hydrography, not current tidal inundation or a legal boundary'};
 await writeFile(`public/data/egans-nhd-${layer}.json`,JSON.stringify(data,null,2)+'\n');
 console.log(`Layer ${layer}: ${data.features.length} features`);
 if(layer===6)await writeFile('src/data/creek.json',JSON.stringify(data)+'\n');
}
