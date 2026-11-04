import poemData from './data/poems.json';
import {esc} from './ui.js';
const quill='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3C13.5 3.5 7.8 8 6.8 15.3c3 .6 6-.2 8-2.1-1.3 0-2.4-.2-3.3-.7 2.6-.2 4.8-1.2 6.2-3.1-1.1 0-2.1-.2-2.9-.6C17.7 7.3 19.7 5.6 20.5 3Z"/><path d="M3.5 21 14 9.5"/></svg>';
const targets=new Map(poemData.poems.flatMap(poem=>Object.entries(poem.targets).map(([key,phrase])=>[key,{poem,phrase}])));
export const poemMark=key=>{const t=targets.get(key);return t?`<button type="button" class="poem-mark" data-poem="${esc(key)}" aria-label="Read a poem: ${esc(t.poem.title)} by ${esc(t.poem.poet)}" title="Read a poem">${quill}</button>`:'';};
// Whole-word matching keeps "doe" from lighting up inside "does".
export function highlightPoem(text,phrase){const quoted=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(`(?<![\\p{L}\\p{N}])${quoted}(?![\\p{L}\\p{N}])`,'giu');let html='',last=0;for(const m of text.matchAll(pattern)){html+=`${esc(text.slice(last,m.index))}<mark>${esc(m[0])}</mark>`;last=m.index+m[0].length;}return html+esc(text.slice(last));}
function poemWindow(){let d=document.querySelector('#poem-window');if(d)return d;
 document.body.insertAdjacentHTML('beforeend','<dialog id="poem-window" aria-labelledby="poem-title"><div class="poem-head"><div><h2 id="poem-title"></h2><p id="poem-poet"></p></div><button id="poem-close" aria-label="Close poem">✕</button></div><div id="poem-text" tabindex="0" role="region" aria-label="Poem text"></div><p class="poem-url">Online text: <a id="poem-url" target="_blank" rel="noopener"></a></p></dialog>');
 d=document.querySelector('#poem-window');d.querySelector('#poem-close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close();});return d;}
function openPoem(key){const {poem,phrase}=targets.get(key),d=poemWindow(),body=d.querySelector('#poem-text'),link=d.querySelector('#poem-url');
 d.querySelector('#poem-title').textContent=poem.title;d.querySelector('#poem-poet').textContent=poem.excerpt?`${poem.poet} · excerpt`:poem.poet;link.href=poem.url;link.textContent=poem.url;
 body.classList.toggle('poem-link-only',Boolean(poem.linkOnly));body.innerHTML=poem.linkOnly?'This poem is still under copyright, so it is not reproduced here. Follow the link below to read it where it was published.':highlightPoem(poem.text,phrase);d.showModal();
 const first=body.querySelector('mark');body.scrollTop=first?Math.max(0,first.offsetTop-body.offsetTop-body.clientHeight/3):0;body.focus();}
document.addEventListener('click',e=>{const mark=e.target.closest('[data-poem]');if(mark)openPoem(mark.dataset.poem);});
