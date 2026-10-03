import {parseNOAA} from './science.js';
export async function fetchLatestLevel(){
 const query=new URLSearchParams({application:'EgansCreekAtlas',station:'8720030',product:'water_level',date:'latest',datum:'MLLW',time_zone:'gmt',units:'metric',format:'json'});
 const response=await fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${query}`,{signal:AbortSignal.timeout(12000),cache:'no-store'});
 if(!response.ok)throw Error(`NOAA request returned ${response.status}`);
 const points=parseNOAA(await response.json(),'water_level');
 if(!points.length)throw Error('No recent observation available.');
 return points.at(-1);
}
export async function fetchTides(date,product='predictions'){
 const key=`egans-noaa-v1-${date}-${product}`;
 const day=date.replaceAll('-','');
 const query=new URLSearchParams({application:'EgansCreekAtlas',station:'8720030',product,begin_date:day,end_date:day,datum:'MLLW',time_zone:'gmt',units:'metric',format:'json'});
 if(product==='predictions')query.set('interval','6');
 try{
  const response=await fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${query}`,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error(`NOAA request returned ${response.status}`);
  const points=parseNOAA(await response.json(),product);if(!points.length)throw Error('No water levels available for this date.');
  const data={station:'8720030',product,datum:'MLLW',units:'metric',timeZone:'UTC',date,points,fetchedAt:new Date().toISOString()};
  try{localStorage.setItem(key,JSON.stringify(data));}catch{}
  return {...data,cached:false};
 }catch(error){
  try{const cache=JSON.parse(localStorage.getItem(key));if(cache?.points?.length)return {...cache,cached:true};}catch{}
  throw error;
 }
}
