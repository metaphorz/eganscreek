import artData from './data/art.json';
import {esc} from './ui.js';
import {publicURL} from './paths.js';
const palette='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5c-5 0-9 3.6-9 8.2 0 4.5 3.7 8.3 8.2 8.3 1.4 0 2.2-.9 2.2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8h2.2c2.5 0 4.6-2 4.6-4.5C21 6.4 17 3.5 12 3.5Z"/><g fill="currentColor" stroke="none"><circle cx="7.4" cy="11.4" r="1.2"/><circle cx="9.6" cy="7.6" r="1.2"/><circle cx="14.2" cy="7.2" r="1.2"/><circle cx="17.2" cy="10.4" r="1.2"/></g></svg>';
const works=new Map(artData.works.map(work=>[work.key,work]));
export const artMark=key=>{const w=works.get(key);return w?`<button type="button" class="poem-mark art-mark" data-art="${esc(key)}" aria-label="View art: ${esc(w.title)} by ${esc(w.artist)}" title="View art">${palette}</button>`:'';};
function artWindow(){let d=document.querySelector('#art-window');if(d)return d;
 document.body.insertAdjacentHTML('beforeend','<dialog id="art-window" aria-labelledby="art-title"><div class="poem-head"><div><h2 id="art-title"></h2><p id="art-artist"></p></div><button id="art-close" aria-label="Close artwork">✕</button></div><div id="art-frame"><img id="art-image" alt=""></div><p id="art-note"></p><p class="poem-url" id="art-credit"></p></dialog>');
 d=document.querySelector('#art-window');d.querySelector('#art-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;}
function openArt(key){const w=works.get(key),d=artWindow(),img=d.querySelector('#art-image'),license=w.licenseUrl?`<a href="${esc(w.licenseUrl)}" target="_blank" rel="noopener">${esc(w.license)}</a>`:esc(w.license);
 d.querySelector('#art-title').textContent=w.title;d.querySelector('#art-artist').textContent=`${w.artist}, ${w.date}`;img.src=publicURL(w.image);img.alt=`${w.title} by ${w.artist}`;img.width=w.width;img.height=w.height;img.style.width=`min(100%,${w.width}px,${62*w.width/w.height}vh)`;d.querySelector('#art-note').textContent=w.note;
 d.querySelector('#art-credit').innerHTML=`${license} · <a id="art-source" href="${esc(w.source)}" target="_blank" rel="noopener">Source record</a>`;d.showModal();}
document.addEventListener('click',e=>{const mark=e.target.closest('[data-art]');if(mark)openArt(mark.dataset.art);});
window.addEventListener('hashchange',()=>document.querySelector('#art-window')?.close());
