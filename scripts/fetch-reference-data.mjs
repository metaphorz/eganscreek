import {writeFile} from 'node:fs/promises';
import {parseNOAA} from '../src/science.js';
const date='2026-10-01';
const params=new URLSearchParams({application:'EgansCreekAtlas',station:'8720030',product:'predictions',begin_date:'20261001',end_date:'20261001',datum:'MLLW',time_zone:'gmt',units:'metric',format:'json',interval:'6'});
const url='https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?'+params;
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`NOAA ${response.status}`);
const raw=await response.json(),points=parseNOAA(raw,'predictions');if(points.length<200)throw Error('Incomplete reference day');
const data={station:'8720030',product:'predictions',datum:'MLLW',units:'metric',timeZone:'UTC',date,sourceURL:url,fetchedAt:new Date().toISOString(),description:'Archived astronomical predictions for a reference day, not observed conditions or a confirmed visit date.',points};
await writeFile('public/data/noaa-2026-10-01.json',JSON.stringify(data,null,2)+'\n');console.log(`Saved ${points.length} NOAA predictions for ${date}.`);
