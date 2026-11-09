import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {fresh} from '../src/game.js';

const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    await context.addInitScript(state=>localStorage.setItem('novatap',JSON.stringify(state)),{...fresh(),dust:100,total:100});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173');
    await page.clock.install();
    if(height>width){
      const bounds=await page.evaluate(()=>({
        orb:document.querySelector('#orb').getBoundingClientRect().toJSON(),
        energy:document.querySelector('.energy').getBoundingClientRect().toJSON(),
        nav:document.querySelector('.sidebar').getBoundingClientRect().toJSON(),
      }));
      assert.ok(bounds.orb.top>=0&&bounds.orb.bottom<bounds.nav.top,'Tap target must fit above navigation');
      assert.ok(bounds.energy.bottom<bounds.nav.top,'Energy must be visible without scrolling');
    }
    for(let i=0;i<12;i++)await page.locator('#orb').tap();
    await page.clock.fastForward(300);
    await expect(page.locator('#dust')).toHaveText('112');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('novatap')).dust),112);
    assert.ok(await page.locator('.particle').count()<=8,'Tap particles must stay bounded');
    await page.locator('#orb').tap();
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('novatap')).dust),113,'Suspending the app must flush the latest tap immediately');
    await page.locator('.energy-link').tap();
    await expect(page.locator('#energy-upgrade')).toBeInViewport();
    for(const tab of ['upgrades','journey','collect']){
      await page.locator(`nav [data-tab="${tab}"]`).tap();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No horizontal overflow in ${tab} at ${width}x${height}`);
      const controls=await page.locator(`#${tab}-view button:not(:disabled), nav button, .sound`).evaluateAll(nodes=>nodes.filter(e=>e.getClientRects().length).map(e=>({label:e.getAttribute('aria-label')||e.textContent,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})));
      for(const c of controls)assert.ok(c.height>=44&&c.width>=44,`Touch target too small: ${c.label}`);
    }
    await page.evaluate(()=>window.scrollTo(0,400));
    const collectScroll=await page.evaluate(()=>scrollY);
    await page.locator('nav [data-tab="journey"]').tap();
    assert.equal(await page.evaluate(()=>scrollY),0);
    await page.locator('[data-claim="0"]').focus();
    await page.evaluate(()=>window.focusedReward=document.activeElement);
    await page.clock.fastForward(1100);
    assert.equal(await page.evaluate(()=>document.activeElement===window.focusedReward&&window.focusedReward.isConnected),true,'Timer updates must retain focused controls');
    await page.locator('nav [data-tab="collect"]').tap();
    assert.equal(await page.evaluate(()=>scrollY),collectScroll);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`/workspace/novatap/phone-${width}x${height}-screenshot.png`});
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}x${height}: touch targets, tap burst, visible energy, tab layout/scroll, stable focus`);
    await context.close();
  }
}finally{await browser.close();}
