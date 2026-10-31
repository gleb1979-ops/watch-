// Run with a local server on :8000 and Playwright + Chromium installed.
// Exercises real clicks and walking from spawn, rather than teleporting to entries.
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8000');
    await page.waitForFunction(()=>gameTest.artReady);
    await page.click('#start');
    async function clickCanvas(x,y,options={}) {
      const r=await page.locator('#game').boundingBox();
      const k=Math.min(r.width/1200,r.height/720);
      await page.mouse.click(r.x+(r.width-1200*k)/2+x*k,r.y+(r.height-720*k)/2+y*k,options);
    }
    const result=[];
    for(let z=0;z<3;z++) {
      const count=await page.evaluate(z=>gameTest.zones[z].slides.length,z);
      for(let i=0;i<count;i++) {
        await page.evaluate(z=>{gameTest.reset();document.querySelector(`[data-zone="${z}"]`).click();gameTest.enemies.forEach(e=>e.stun=10000);},z);
        await page.waitForTimeout(100);
        if(i===0) {
          // Click the visible attraction artwork, not its tiny entry coordinate.
          const c=await page.evaluate(({z,i})=>{const s=gameTest.zones[z].slides[i].slot,v=gameTest.parkView;return{x:(s.x+s.w*.5-v.camera.x)*v.zoom,y:(s.y+s.h*.7-v.camera.y)*v.zoom};},{z,i});
          await clickCanvas(c.x,c.y);
        } else {
          const b=await page.evaluate(({z,i})=>gameTest.zones[z].slides[i].base,{z,i});
          await clickCanvas(1005+b.x/1200*177,537+b.y/720*106);
        }
        const trip=await page.evaluate(i=>{
          const g=gameTest;let steps=0;while(!g.slide&&steps++<1200)g.update(.04);
          if(!g.slide)return{entered:false,x:g.player.x,y:g.player.y,path:g.player.autoPath,queued:g.player.queuedRide};
          const correct=g.slide.i===i;while(g.slide&&g.slide.phase!=='ride'&&steps++<1800)g.update(.04);
          const riding=g.slide?.phase==='ride';while(g.slide&&steps++<2300)g.update(.04);
          return{entered:correct,riding,exited:!g.slide};
        },i);
        result.push({zone:z,slide:i,...trip});assert.equal(trip.entered,true,JSON.stringify(result));assert.equal(trip.riding,true);assert.equal(trip.exited,true);
      }
    }
    await page.evaluate(()=>{gameTest.reset();gameTest.enemies.forEach(e=>e.stun=10000);});
    await page.waitForTimeout(200);
    for(const hero of [0,1,2]) {
      await page.evaluate(hero=>gameTest.choose(hero),hero);
      await page.keyboard.down('d');await page.waitForTimeout(250);
      const rig=await page.evaluate(()=>gameTest.avatarRig);
      assert.equal(rig.footPixels.length,2);assert(rig.footPixels.every(f=>f.visible),'Feet clipped: '+JSON.stringify(rig));assert(rig.walking);
      await page.keyboard.up('d');
    }
    await page.screenshot({path:'checks/v11-park.png'});
    await page.evaluate(()=>document.querySelector('#pause').click());
    const fullBody=await page.evaluate(()=>{const image=new Image();image.src='assets/avatar-clothes-v10.webp';return new Promise(resolve=>{image.onload=()=>{const view=ParkAvatar.render(0,{moving:false,frozen:true},image,0),c=document.createElement('canvas');c.width=view.width;c.height=view.height;c.getContext('2d').drawImage(view,0,0);resolve(c.toDataURL());};});});
    require('node:fs').writeFileSync('checks/v11-avatar.png',Buffer.from(fullBody.split(',')[1],'base64'));
    assert.deepEqual(errors,[]);console.log(JSON.stringify({trips:result,feet:'visible on all three heroes',errors}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
