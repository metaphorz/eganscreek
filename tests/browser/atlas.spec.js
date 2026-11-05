import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('seven chapters load without errors and fit the viewport',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const chapter of ['tides','formation','marsh','birds','plants','map','history']){
  await page.goto(`./#page=${chapter}`);await expect(page.locator('main h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:`validation/${testInfo.project.name}-${chapter}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('tide controls synchronize and reset',async({page})=>{
 await page.goto('./#page=tides&mode=learn');await page.getByRole('button',{name:'High',exact:true}).click();await expect(page.locator('#water-value')).toHaveText('6.00 ft');await expect(page.locator('#tide-phase')).toHaveText('Near high water');
 await page.locator('#units').selectOption('m');await expect(page.locator('#water-value')).toHaveText('1.83 m');
 await page.getByRole('button',{name:'Low',exact:true}).click();await expect(page.locator('#water-value')).toHaveText('0.00 m');
 await page.getByRole('button',{name:'Look beneath the surface'}).click();await expect(page.locator('#section')).toBeVisible();
 await page.getByRole('button',{name:'Play tide animation'}).click();await expect(page.getByRole('button',{name:'Pause tide animation'})).toBeVisible();await page.getByRole('button',{name:'Pause tide animation'}).click();
});
test('formation, plant cover, and historical state respond',async({page})=>{
 await page.goto('./#page=formation');await page.locator('[data-stage="4"]').click();await expect(page.locator('#geo-title')).toHaveText('The marsh takes root');
 await page.goto('./#page=marsh');await page.locator('[data-part="stem"]').click();await expect(page.locator('#part-title')).toHaveText('Stems');await page.locator('#density').fill('20');await expect(page.locator('#density-label')).toHaveText('Sparse');await page.locator('#season').selectOption('winter');await expect(page.locator('#season-note')).toContainText('Standing brown');
 await page.goto('./#page=history');await page.locator('[data-history="3"]').click();await expect(page.locator('#south-state')).toHaveText('Saltwater intrusion');await page.locator('[data-history="4"]').click();await expect(page.locator('#south-state')).toHaveText('Freshwater habitat');
});
test('birds filter, compare, browse photos and save an observation',async({page})=>{
 await page.goto('./#page=birds');await expect(page.locator('.bird-card')).toHaveCount(13);
 await page.locator('#bird-search').fill('snowy');await expect(page.locator('.bird-card')).toHaveCount(1);await page.locator('#bird-search').fill('');
 await page.locator('[data-compare="snowy"]').check();await page.locator('[data-compare="great-egret"]').check();await page.locator('#compare-open').click();await expect(page.locator('.comparison article')).toHaveCount(2);await page.locator('#close-dialog').click();
 await page.locator('[data-bird="little-blue"]').click();await page.locator('#bird-photo-slider').fill('2');await expect(page.locator('#photo-number')).toContainText('2 of');await expect(page.locator('#bird-photo-track img').nth(1)).toBeVisible();await page.locator('#photo-next').click();await expect(page.locator('#photo-number')).toContainText('3 of');await page.locator('#record-bird').click();await page.locator('[name="notes"]').fill('<b>A white juvenile near the edge</b>');await page.getByRole('button',{name:'Save observation',exact:true}).click();await expect(page.locator('.note-list')).toContainText('<b>A white juvenile near the edge</b>');await expect(page.locator('.note-list b')).toHaveCount(0);await page.locator('#close-dialog').click();await expect(page.locator('#note-count')).toHaveText('1');
 await page.reload();await page.locator('#open-notebook').click();await expect(page.locator('.note-list article')).toHaveCount(1);await page.getByRole('button',{name:'Delete observation of Little Blue Heron'}).click();await expect(page.locator('.note-list article')).toHaveCount(0);await page.locator('#undo-delete').click();await expect(page.locator('.note-list article')).toHaveCount(1);
});
test('keyboard dialog and bird quiz work',async({page})=>{
 await page.goto('./#page=birds');await page.locator('#bird-quiz').click();await page.locator('[data-answer="snowy"]').click();await expect(page.locator('#quiz-feedback')).toContainText('Correct.');await page.locator('#quiz-next').click();await expect(page.locator('.quiz-question')).toContainText('spoon-shaped');await page.keyboard.press('Escape');await expect(page.locator('#dialog')).not.toBeVisible();
});
test('NOAA error is explicit and learning mode recovers',async({page})=>{
 await page.route('https://api.tidesandcurrents.noaa.gov/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({error:{message:'No data for test date'}})}));
 await page.goto('./#page=tides');await page.locator('#tide-mode').selectOption('prediction');await expect(page.locator('#series-status')).toContainText('Data unavailable:');await expect(page.locator('#water-value')).toHaveText('No data');await page.locator('#tide-mode').selectOption('learn');await expect(page.locator('#data-badge')).toHaveText('Learning mode');await expect(page.locator('#water-value')).not.toHaveText('No data');
});
test('key chapters have no serious accessibility violations',async({page})=>{
 for(const chapter of ['tides','formation','marsh','birds','plants','history']){await page.goto(`./#page=${chapter}`);await expect(page.locator('main h1')).toBeVisible();const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(results.violations.filter(v=>['critical','serious'].includes(v.impact)),JSON.stringify(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);}
});

test('latest observed tide is distinct from slider predictions and Now restores it',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
 await page.route('https://api.tidesandcurrents.noaa.gov/**',route=>{
  const url=new URL(route.request().url());const latest=url.searchParams.get('date')==='latest';
  const rows=latest?[{t:'2026-10-03 11:54',v:'1.2192',q:'p'}]:Array.from({length:240},(_,i)=>({t:`2026-10-03 ${String(Math.floor(i/10)).padStart(2,'0')}:${String(i%10*6).padStart(2,'0')}`,v:'0.6096'}));
  return route.fulfill({contentType:'application/json',body:JSON.stringify({[url.searchParams.get('product')==='predictions'?'predictions':'data']:rows})});
 });
 await page.goto('./#page=tides');await expect(page.locator('#current-level')).toHaveText('4.00 ft');await expect(page.locator('#water-value')).toHaveText('4.00 ft');await expect(page.locator('#current-stamp')).toContainText('6 minutes ago');await expect(page.locator('#water-datum')).toContainText('observed');
 await page.locator('#tide-time').fill('15');await expect(page.locator('#water-value')).toHaveText('2.00 ft');await expect(page.locator('#water-datum')).toContainText('Predicted');await expect(page.locator('#current-level')).toHaveText('4.00 ft');
 await page.locator('#return-now').click();await expect(page.locator('#water-value')).toHaveText('4.00 ft');await page.locator('#units').selectOption('m');await expect(page.locator('#current-level')).toHaveText('1.22 m');
});
test('all species have local loaded photos and mouse dragging changes the gallery',async({page})=>{
 await page.goto('./#page=birds');for(const img of await page.locator('.bird-view img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);}
 await page.locator('[data-bird="snowy"]').click();await expect(page.locator('#bird-photo-track img')).toHaveCount(8);await page.locator('#bird-photo-slider').fill('2');await expect(page.locator('#photo-number')).toContainText('2 of 8');
 const track=page.locator('#bird-photo-track');const box=await track.boundingBox();await page.mouse.move(box.x+box.width*.9,box.y+60);await page.mouse.down();await page.mouse.move(box.x+box.width*.1,box.y+60,{steps:12});await page.mouse.up();await expect(page.locator('#photo-number')).toContainText('3 of 8');
 await track.focus();await page.keyboard.press('ArrowLeft');await expect(page.locator('#photo-number')).toContainText('2 of 8');
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.filter(v=>['critical','serious'].includes(v.impact))).toEqual([]);
});
test('stale latest measurement is clearly labeled',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
 await page.route('https://api.tidesandcurrents.noaa.gov/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({data:[{t:'2026-10-03 10:00',v:'1.2',q:'p'}]})}));
 await page.goto('./#page=tides');await expect(page.locator('#current-stamp')).toContainText('STALE READING');
});

test('Map opens first with geographic creek geometry and layer controls',async({page},testInfo)=>{
 await page.goto('./');await expect(page.locator('.main-nav a').first()).toHaveText('Map');await expect(page.locator('[data-page="map"]')).toHaveAttribute('aria-current','page');await expect(page.locator('#geographic-mode')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.creek-geometry')).toHaveCount(35);await expect(page.locator('.brand')).toContainText('Egans Creek');
 await page.locator('#creek-layer').uncheck();await expect(page.locator('.creek-geometry')).toHaveCount(0);await page.locator('#creek-layer').check();await expect(page.locator('.creek-geometry')).toHaveCount(35);
 await page.locator('#fit-greenway').click();await page.locator('#fit-creek').click();await page.locator('#schematic-mode').click();await expect(page.locator('#map-note')).toContainText('not to scale');await page.locator('#geographic-mode').click();await expect(page.locator('.creek-geometry')).toHaveCount(35);
 await page.waitForTimeout(1000);await page.screenshot({path:`validation/${testInfo.project.name}-map-first.png`,fullPage:true});
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.filter(v=>['critical','serious'].includes(v.impact)),JSON.stringify(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
});

test('every location arrow moves the map and opens its destination repeatedly',async({page},testInfo)=>{
 await page.goto('./');
 for(const id of ['sadler','jasmine','atlantic','station','sadler']){
  await page.locator(`[data-place="${id}"]`).click();await expect(page.locator(`[data-place="${id}"]`)).toHaveAttribute('aria-pressed','true');
  const title=await page.locator(`[data-place="${id}"] strong`).textContent();await expect(page.locator('.leaflet-popup-content strong')).toHaveText(title);
  const marker=page.locator(`.leaflet-marker-icon[title="${title}"]`);await expect(marker).toBeInViewport();
  const m=await marker.boundingBox(),area=await page.locator('#atlas-map').boundingBox();expect(m.x).toBeGreaterThan(area.x);expect(m.x).toBeLessThan(area.x+area.width);expect(m.y).toBeGreaterThan(area.y);expect(m.y).toBeLessThan(area.y+area.height);
 }
 await page.screenshot({path:`validation/${testInfo.project.name}-sadler-focus.png`,fullPage:true});
 await page.locator('#schematic-mode').click();await page.locator('[data-place="sadler"]').click();await expect(page.locator('.leaflet-popup-content strong')).toHaveText('Sadler Road');
 await page.locator('#geographic-mode').click();await page.locator('[data-place="jasmine"]').click();await expect(page.locator('.leaflet-popup-content strong')).toHaveText('Jasmine Street');
});

test('Animals defaults to Birds and includes both anoles, galleries, and notebook records',async({page},testInfo)=>{
 await page.goto('./');await expect(page).toHaveTitle('Egans Creek: A Model');await expect(page.locator('.brand small')).toHaveText('A LIVING LANDSCAPE AND MODEL');await expect(page.locator('.creator-credit')).toHaveText('Creatively spawned by Paul Fishwick, OpenAI Codex & Claude Code');
 await page.locator('[data-page="animals"]').click();await expect(page.locator('[data-animal-group="birds"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.bird-card')).toHaveCount(13);await expect(page.locator('[data-animal-group]')).toHaveCount(6);
 await page.locator('[data-animal-group="reptiles"]').click();await expect(page.locator('[data-animal="116461"]')).toContainText('Brown Anole');await expect(page.locator('[data-animal="36514"]')).toContainText('Green Anole');await expect(page.locator('.anole-note')).toContainText('Green Anole can be brown');
 await page.locator('[data-animal="36514"]').click();await page.locator('#animal-photo-slider').fill('2');await expect(page.locator('#animal-photo-number')).toHaveText('2 of 2');await page.locator('#record-animal').click();await expect(page.locator('[name="species"]')).toHaveValue('36514');await page.getByRole('button',{name:'Save observation',exact:true}).click();await expect(page.locator('.note-list')).toContainText('Green Anole');await page.locator('#close-dialog').click();
 await page.screenshot({path:`validation/${testInfo.project.name}-reptiles.png`,fullPage:true});
 for(const group of ['mammals','amphibians','fish','invertebrates']){await page.locator(`[data-animal-group="${group}"]`).click();await expect(page.locator('.animal-grid .bird-card').first()).toBeVisible();}
 await page.locator('[data-animal-group="birds"]').click();await expect(page.locator('.bird-card')).toHaveCount(13);
});
test('Plants & Trees is its own chapter with credited salt marsh plants',async({page})=>{
 await page.goto('./');await page.locator('[data-page="plants"]').click();await expect(page.locator('[data-animal-group]')).toHaveCount(0);await expect(page.locator('.animal-grid .bird-card')).toHaveCount(18);
 await page.locator('[data-animal="62853"]').click();await expect(page.locator('.bird-detail figcaption').first()).toContainText('Maia McGuire');await page.locator('#close-dialog').click();
 await page.goto('./#page=animals&group=plants');await expect(page.locator('[data-page="plants"]')).toHaveAttribute('aria-current','page');
});
test('animal sightings map filters records and shows honest empty states',async({page},testInfo)=>{
 await page.goto('./#page=animals&group=reptiles');await page.locator('#animal-map-view').click();await expect(page.locator('.wildlife-point').first()).toBeVisible();await page.locator('#sighting-species').selectOption('36514');await expect(page.locator('#sighting-count')).toHaveText('1 saved observation');await expect(page.locator('.wildlife-point')).toHaveCount(1);await page.locator('.wildlife-point').click();await expect(page.locator('.leaflet-popup-content')).toContainText('Green Anole');await expect(page.locator('.leaflet-popup-content')).toContainText('2021-06-23');
 await page.locator('#sighting-period').selectOption('90');await expect(page.locator('#sighting-count')).toHaveText('0 saved observations');await expect(page.locator('#sighting-list')).toContainText('does not mean the animal is absent');await page.locator('#sighting-period').selectOption('all');
 await page.screenshot({path:`validation/${testInfo.project.name}-wildlife-map.png`,fullPage:true});
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(results.violations.filter(v=>['critical','serious'].includes(v.impact)),JSON.stringify(results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
});
test('map accepts mouse wheel zoom and History links both Angela Ray stories',async({page})=>{
 await page.goto('./');const scale=page.locator('.leaflet-control-scale-line').first();const before=await scale.textContent();await page.locator('#atlas-map').hover();await page.mouse.wheel(0,-450);await expect(scale).not.toHaveText(before);
 await page.locator('[data-page="history"]').click();await expect(page).toHaveTitle('Egans Creek: A Model');const stories=page.getByRole('navigation',{name:'Angela Ray’s two-part history'});await expect(stories.getByRole('link')).toHaveCount(2);await expect(stories.getByRole('link').nth(0)).toHaveAttribute('href',/106405$/);await expect(stories.getByRole('link').nth(1)).toHaveAttribute('href',/107197$/);
});
test('poems open only on click, highlight the match, and show their URL',async({page})=>{
 await page.goto('./#page=animals&group=birds');const mark=page.locator('.bird-card [data-poem="species:great-blue"]');await mark.hover();await expect(page.locator('#poem-window')).toHaveCount(0);await mark.click();
 const win=page.locator('#poem-window');await expect(win).toBeVisible();await expect(win.locator('h2')).toHaveText('The Song of Hiawatha, Introduction');await expect(win).toContainText('Henry Wadsworth Longfellow');await expect(win.locator('mark').first()).toHaveText('The blue heron, the Shuh-shuh-gah');await expect(win.locator('mark').first()).toBeInViewport();await expect(win.locator('#poem-url')).toHaveAttribute('href',/^https:/);
 expect(await win.locator('#poem-text').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);expect(await new AxeBuilder({page}).include('#poem-window').analyze().then(r=>r.violations)).toEqual([]);
 await page.keyboard.press('Escape');await expect(win).toBeHidden();
 await page.goto('./#page=map');await page.locator('[data-poem="chapter:map"]').click();await expect(win).toContainText('still under copyright');await expect(win.locator('mark')).toHaveCount(0);await expect(win.locator('#poem-url')).toHaveAttribute('href',/rattle\.com/);await win.locator('#poem-close').click();
 await page.goto('./#page=plants');await page.locator('[data-poem="species:47902"]').click();await expect(win.locator('mark')).toHaveText('The cactus guarded with thorns');await page.keyboard.press('Escape');
 await page.goto('./#page=animals&group=invertebrates');await expect(page.locator('.animal-intro')).toContainText('Most of the invertebrates are butterflies.');await expect(page.locator('[data-poem="species:49150"]')).toHaveCount(0);await page.locator('[data-poem="place:butterflies"]').click();await expect(win.locator('h2')).toHaveText('The Butterfly’s Day');await page.keyboard.press('Escape');
 await page.locator('[data-animal-group="mammals"]').click();await expect(page.locator('.animal-intro h2')).toContainText('Mammals');await expect(page.locator('.animal-intro')).not.toContainText('butterflies.');await page.locator('[data-animal-group="reptiles"]').click();await expect(page.locator('[data-poem="species:27137"]')).toHaveCount(0);await page.locator('[data-poem="species:29317"]').click();await expect(win.locator('mark').first()).toHaveText('A narrow fellow in the grass');await page.keyboard.press('Escape');
 await page.evaluate(()=>{location.hash='page=history';});await expect(win).toBeHidden();
});
test('stage, plant part, and timeline poems follow the selected step',async({page})=>{
 const win=page.locator('#poem-window'),read=async(key,text)=>{await page.locator(`[data-poem="${key}"]`).click();await expect(win.locator('mark').first()).toHaveText(text);await page.keyboard.press('Escape');await expect(win).toBeHidden();};
 await page.goto('./#page=formation');await page.locator('[data-stage="3"]').click();await expect(page.locator('#geo-title')).toHaveText('A sheltered lagoon');await read('stage:3','bays, lagoons, creeks');await read('place:two-ways','firm soil win of the watery main');
 await page.goto('./#page=marsh');await page.locator('[data-part="stem"]').click();await expect(page.locator('#part-title')).toHaveText('Stems');await read('part:stem','What is the grass?');await page.locator('[data-part="habitat"]').click();await read('part:habitat','Feeds among the reeds and rushes');await read('place:alone','Nothing is fair or good alone');
 await page.goto('./#page=history');await page.locator('[data-history="3"]').click();await read('step:3','creeks and inlets making');
 await page.goto('./#page=tides&mode=learn');await read('place:edge','The rim, the sediment that stands for all the water and all the land of the globe');
});

test('art opens on click with its credit, beside any poem',async({page})=>{
 const win=page.locator('#art-window');
 await page.goto('./#page=animals&group=birds');const mark=page.locator('.bird-card [data-art="species:anhinga"]');await mark.hover();await expect(win).toHaveCount(0);await mark.click();
 await expect(win).toBeVisible();await expect(win.locator('h2')).toHaveText('Black-bellied Darter');await expect(win).toContainText('John James Audubon');await expect(win).toContainText('Public domain');await expect(win.locator('#art-source')).toHaveAttribute('href',/commons\.wikimedia\.org/);
 await expect.poll(()=>win.locator('#art-image').evaluate(i=>i.complete&&i.naturalWidth)).toBeGreaterThan(0);const shown=await win.locator('#art-image').boundingBox();expect(shown.height).toBeGreaterThan(200);expect(Math.abs(shown.width/shown.height-960/1381)).toBeLessThan(.02);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);expect(await new AxeBuilder({page}).include('#art-window').analyze().then(r=>r.violations)).toEqual([]);await win.locator('#art-close').click();await expect(win).toBeHidden();
 await page.goto('./#page=plants');const poem=await page.locator('[data-poem="species:47902"]').boundingBox(),art=await page.locator('[data-art="species:47902"]').boundingBox();expect(art.x+art.width<=poem.x||poem.x+poem.width<=art.x).toBe(true);
 await page.goto('./#page=animals&group=invertebrates');await page.locator('[data-art="place:butterflies"]').click();await expect(win).toContainText('MathewTownsend');await expect(win.getByRole('link',{name:'CC BY-SA 3.0'})).toHaveAttribute('href',/creativecommons\.org/);await page.goto('./#page=map');await expect(win).toBeHidden();
 await page.goto('./#page=formation');await expect(page.locator('[data-art="place:coast"]')).toBeVisible();await expect(page.locator('[data-art="stage:4"]')).toHaveCount(0);await page.locator('[data-stage="4"]').click();await page.locator('[data-art="stage:4"]').click();await expect(win.locator('h2')).toHaveText('The Great Florida Marsh');
});
