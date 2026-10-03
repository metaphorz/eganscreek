import {test,expect} from '@playwright/test';
test('real NOAA observation loads through the browser',async({page},testInfo)=>{
 test.skip(!process.env.ATLAS_LIVE,'Optional external-service check');
 await page.goto('/#page=tides');
 await expect(page.locator('#current-level')).toHaveText(/^-?\d+\.\d{2} ft$/,{timeout:20000});
 await expect(page.locator('#current-stamp')).toContainText('Measured');
 await expect(page.locator('#data-badge')).toHaveText('NOAA station data',{timeout:25000});
 await page.screenshot({path:`validation/${testInfo.project.name}-live-tides.png`,fullPage:true});
 console.log('NOAA browser observation:',await page.locator('#current-level').textContent(),await page.locator('#current-stamp').textContent());
});
test('production service worker retains geometry and photos offline',async({page,context})=>{
 test.skip(!process.env.ATLAS_OFFLINE,'Requires production preview');
 await page.goto('/');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.locator('.creek-geometry')).toHaveCount(35);
 await page.locator('[data-page="animals"]').click();await page.locator('[data-bird="little-blue"]').click();await page.locator('#bird-photo-slider').fill('4');
 await expect.poll(()=>page.locator('#bird-photo-track img').nth(3).evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 await page.locator('#close-dialog').click();await page.locator('[data-page="tides"]').click();await expect(page.locator('#current-level')).toHaveText('Unavailable');await page.locator('#tide-mode').selectOption('sample');await expect(page.locator('#data-badge')).toHaveText('Archived predictions');
});
