// Start a local server on :8000, then run with Playwright and Chromium installed.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.sliceTest?.ready);
  await page.click('#start');await page.waitForTimeout(150);
  const initial=await page.evaluate(()=>sliceTest.state.position);
  await page.keyboard.down('ArrowRight');await page.evaluate(()=>{for(let i=0;i<10;i++)sliceTest.update(.04);});await page.keyboard.up('ArrowRight');
  const moved=await page.evaluate(()=>sliceTest.state);
  assert(Math.hypot(moved.position[0]-initial[0],moved.position[2]-initial[2])>1,'Walking must actually move the child');
  await page.click('#go');
  const stages=[];
  for(let i=0;i<80;i++){
   await page.evaluate(()=>{for(let j=0;j<12;j++)sliceTest.update(.04);});
   const s=await page.evaluate(()=>sliceTest.state);if(!stages.includes(s.mode))stages.push(s.mode);
   if(s.mode==='ride'&&s.phase>.18)break;
   assert(i<79,'Stuck before the slide: '+JSON.stringify(s));
  }
  assert(stages.includes('climb'));assert(stages.includes('platform'));assert(stages.includes('ride'));
  const directions=[];
  for(let turn=0;turn<3;turn++){
   await page.keyboard.down('ArrowLeft');await page.evaluate(()=>{for(let i=0;i<30;i++)sliceTest.update(.04);});await page.keyboard.up('ArrowLeft');
   const left=await page.evaluate(()=>({lane:sliceTest.state.lane,...sliceTest.screen}));
   await page.keyboard.down('ArrowRight');await page.evaluate(()=>{for(let i=0;i<40;i++)sliceTest.update(.04);});await page.keyboard.up('ArrowRight');
   const right=await page.evaluate(()=>({lane:sliceTest.state.lane,...sliceTest.screen}));
   assert(left.lane<0&&right.lane>0,'Keyboard steering reversed');
   assert(left.heroX<left.centerX&&right.heroX>right.centerX,'Screen steering reversed: '+JSON.stringify({left,right}));directions.push(true);
  }
  await page.screenshot({path:'checks/slice-tested-ride.png'});
  for(let i=0;i<100;i++){
   await page.evaluate(()=>{for(let j=0;j<10;j++)sliceTest.update(.04);});
   const s=await page.evaluate(()=>sliceTest.state);if(!stages.includes(s.mode))stages.push(s.mode);
   if(s.finished)break;assert(i<99,'Did not exit the pool');
  }
  assert(stages.includes('splash')&&stages.includes('exit'));
  await page.click('#view');await page.evaluate(()=>{for(let i=0;i<80;i++)sliceTest.update(.04);});await page.waitForTimeout(100);
  await page.screenshot({path:'checks/slice-overview.png'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({stages,directions,drawCalls:await page.evaluate(()=>sliceTest.drawCalls),errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
