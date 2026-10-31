// Serve the repository on :8000. Requires Playwright and Chromium.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>window.sliceTest?.ready);
  await page.evaluate(()=>{
   window.motion={stages:[],transitions:[],minClearance:Infinity,maxBank:0,maxLean:0,occludedFrames:0};
   window.advanceSlice=(count,dt=.02)=>{const g=sliceTest,m=motion;for(let i=0;i<count;i++){
    const before=g.state;g.update(dt);const after=g.state;
    if(!m.stages.includes(after.mode))m.stages.push(after.mode);
    if(before.mode!==after.mode)m.transitions.push({from:before.mode,to:after.mode,jump:Math.hypot(...after.position.map((x,j)=>x-before.position[j]))});
    if(after.mode==='ride'){m.minClearance=Math.min(m.minClearance,g.clearance);m.maxBank=Math.max(m.maxBank,Math.abs(after.roll));m.maxLean=Math.max(m.maxLean,Math.abs(after.lean));m.occludedFrames+=Number(g.cameraBlocked);}
   }};
  });
  await page.click('#start');await page.waitForTimeout(150);
  const initial=await page.evaluate(()=>sliceTest.state.position);
  await page.keyboard.down('ArrowRight');await page.evaluate(()=>advanceSlice(20));await page.keyboard.up('ArrowRight');
  const moved=await page.evaluate(()=>sliceTest.state);
  assert(Math.hypot(moved.position[0]-initial[0],moved.position[2]-initial[2])>1,'Walking did not move the child');
  await page.click('#go');await page.click('#pause'); // Time-step independently of rendering speed.
  for(let i=0;i<110;i++){
   await page.evaluate(()=>advanceSlice(20));
   const s=await page.evaluate(()=>sliceTest.state);
   if(s.mode==='ride'&&s.phase>.06)break;
   assert(i<109,'Stuck before the slide: '+JSON.stringify(s));
  }
  const directions=[];
  for(let turn=0;turn<3;turn++){
   await page.keyboard.down('ArrowLeft');await page.evaluate(()=>advanceSlice(32));await page.keyboard.up('ArrowLeft');
   const left=await page.evaluate(()=>({lane:sliceTest.state.lane,...sliceTest.screen}));
   await page.keyboard.down('ArrowRight');await page.evaluate(()=>advanceSlice(36));await page.keyboard.up('ArrowRight');
   const right=await page.evaluate(()=>({lane:sliceTest.state.lane,...sliceTest.screen}));
   assert(left.heroX<left.centerX&&right.heroX>right.centerX,'Screen steering reversed: '+JSON.stringify({left,right}));directions.push(true);
  }
  await page.screenshot({path:'checks/slice-tested-ride.png'});
  for(let i=0;i<90;i++){
   await page.evaluate(()=>advanceSlice(20));
   if(await page.evaluate(()=>sliceTest.state.finished))break;
   assert(i<89,'Did not exit the pool');
  }
  const result=await page.evaluate(()=>({...motion,duration:sliceTest.state.rideTime,drawCalls:sliceTest.drawCalls}));
  for(const phase of ['climb','platform','ride','splash','exit'])assert(result.stages.includes(phase),'Missing '+phase);
  assert(result.duration<8,'Slide must accelerate and finish much faster than the old 18-second ride');
  const launch=result.transitions.find(t=>t.from==='platform'&&t.to==='ride');assert(launch&&launch.jump<.15,'Abrupt entry: '+JSON.stringify(launch));
  assert(result.maxBank>.25&&result.maxLean>.08,'Missing banking and steering lean');
  assert(result.minClearance>=.03,'Mat clips the flume: '+result.minClearance);
  assert.equal(result.occludedFrames,0,'Scenery blocked the rider camera');
  await page.click('#view');await page.evaluate(()=>advanceSlice(160));await page.waitForTimeout(100);
  await page.screenshot({path:'checks/slice-overview.png'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,directions,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
