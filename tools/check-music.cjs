const {chromium}=require('C:/Users/mkara/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/pages/en.html#music');await page.locator('#music').scrollIntoViewIfNeeded();
const action=name=>page.locator(`[data-music-action="${name}"]`);
await action('play').click();await page.waitForTimeout(700);assert(await page.locator('audio').evaluate(a=>!a.paused && a.currentTime>0));
await action('play').click();assert(await page.locator('audio').evaluate(a=>a.paused));
await action('stop').click();assert.equal(await page.locator('audio').evaluate(a=>a.currentTime),0);
await page.locator('.music-playlist button').dblclick();await page.waitForTimeout(350);assert(await page.locator('audio').evaluate(a=>!a.paused));
await action('mute').click();assert(await page.locator('audio').evaluate(a=>a.muted));await action('mute').click();
await action('louder').click();assert(Math.abs(await page.locator('audio').evaluate(a=>a.volume)-.75)<.001);
await page.locator('[data-music-progress]').fill('50');assert(await page.locator('audio').evaluate(a=>a.currentTime/a.duration>.49));
await action('next').click();await page.waitForTimeout(300);await action('previous').click();await page.waitForTimeout(300);
await action('stop').click();await page.screenshot({path:'music-preview.png'});
for(const lang of ['ar','da','de','el','en','es','fr','hi','hu','it','ja','ko','ru','sv','tr','zh']) {await page.goto(`http://127.0.0.1:4173/pages/${lang}.html#music`);assert.equal(await page.locator('[data-music-player]').count(),1);assert.equal(await page.locator('.music-playlist button').count(),1);}
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4173/pages/en.html#music');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'music-mobile-preview.png'});

await page.route('**/media-manifest.js', async route => {const response=await route.fetch();const text=await response.text();const data=JSON.parse(text.match(/window\.MORAKI_MEDIA\s*=\s*([\s\S]*?);\s*$/)[1]);data.music=Array.from({length:30},(_,i)=>({...data.music[0],title:'Test song '+(i+1)}));await route.fulfill({response,body:'window.MORAKI_MEDIA = '+JSON.stringify(data)+';'});});
await page.goto('http://127.0.0.1:4173/pages/en.html#music');await page.locator('.music-playlist button').nth(1).dblclick();await page.waitForTimeout(400);assert.equal(await page.locator('[data-music-title]').innerText(),'Test song 2');assert(await page.locator('audio').evaluate(a=>!a.paused));await page.locator('.music-playlist button').last().scrollIntoViewIfNeeded();assert(await page.locator('.music-playlist').evaluate(el=>el.scrollTop>0 && getComputedStyle(el).scrollbarWidth==='none'));await action('next').click();await page.waitForTimeout(300);assert.equal(await page.locator('[data-music-title]').innerText(),'Test song 3');await action('stop').click();

for(const [width,rows] of [[390,3],[1440,5]]) {
await page.setViewportSize({width,height:1000});
const dimensions=await page.locator('.music-playlist').evaluate(el=>({height:el.clientHeight,row:el.querySelector('button').getBoundingClientRect().height,gap:parseFloat(getComputedStyle(el.children[1]).marginTop)}));assert(Math.abs(dimensions.height-(rows*dimensions.row+(rows-1)*dimensions.gap))<2);
}
assert.equal(await page.locator('.menu-panel a[href="#music"]').count(),1);
assert.equal(await page.locator('.music-library-heading, .music-hint, [data-music-count]').count(),0);
await action('play').click();await page.waitForTimeout(250);assert.equal(await action('play').locator('svg path').getAttribute('d'),'M8 5v14M16 5v14');await action('stop').click();
assert.equal(await action('mute').locator('svg').count(),1);
assert.deepEqual(errors,[]);console.log('PASS: playback, pause, stop, double-click, mute, volume, seek, next/previous, 16 languages, mobile width; no JavaScript errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
