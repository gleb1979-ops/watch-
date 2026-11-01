const assert=require('node:assert/strict');
const{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
for(const course of (process.env.COURSE?[process.env.COURSE]:['blackhole','boomerang','race'])){
 const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/?course='+course);await page.waitForFunction(()=>window.sliceTest?.ready);
 assert.equal(await page.locator('[data-course]').count(),7);assert.equal(await page.locator('[data-course="'+course+'"]').getAttribute('aria-pressed'),'true');
 await page.click('#start');await page.click('#go');await page.click('#pause');let shot=false,finished=false;
 await page.evaluate(()=>window.run={stages:[],minY:Infinity,maxY:-Infinity,maxSpeed:0,backDistance:0,last:null,rivalsMoved:false,escaped:0});
 for(let i=0;i<400;i++){
  const s=await page.evaluate(()=>{for(let j=0;j<20;j++){sliceTest.update(.02);const s=sliceTest.state,r=window.run;if(!r.stages.includes(s.mode))r.stages.push(s.mode);if(s.mode==='ride'){if(sliceTest.course==='blackhole'&&s.phase>.03&&s.phase<.97&&!sliceTest.cameraEnclosed)r.escaped++;r.maxSpeed=Math.max(r.maxSpeed,s.speed);r.minY=Math.min(r.minY,s.position[1]);r.maxY=Math.max(r.maxY,s.position[1]);if(s.boomStage==='back'&&r.last)r.backDistance+=Math.hypot(...s.position.map((x,k)=>x-r.last[k]));r.last=s.position;if(sliceTest.rivals.some(x=>x.progress>.1))r.rivalsMoved=true;}}return sliceTest.state;});
  assert(s.position.every(Number.isFinite)&&s.camera.every(Number.isFinite),'Non-finite position');assert(s.position[1]<30,'Unexpected geometry lift: '+s.position[1]);
  if(!shot&&s.mode==='ride'&&s.phase>.35){await page.screenshot({path:'checks/'+course+'-ride.png'});shot=true;}
  if(s.finished){finished=true;break;}
 }
 const result=await page.evaluate(()=>({course:sliceTest.course,state:sliceTest.state,run:window.run,rivals:sliceTest.rivals,hud:document.getElementById('race-hud').textContent,closed:sliceTest.closed}));
 assert(finished,'Route never finished');for(const stage of ['climb','platform','ride','splash','exit'])assert(result.run.stages.includes(stage),'Missing '+stage);
 if(course==='blackhole'){assert(result.closed,'Black Hole is not enclosed');assert.equal(result.run.escaped,0,'Camera escaped the tunnel');}
 if(course==='boomerang')assert(result.run.backDistance>15,'No physical backward descent');
 if(course==='race'){assert.equal(result.rivals.length,3);assert(result.run.rivalsMoved);assert(result.state.rideTime>29&&result.state.rideTime<32,'Race duration: '+result.state.rideTime);assert(result.state.raceResult>=1&&result.state.raceResult<=4);assert(result.hud.includes('ФИНИШ'));}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({course,duration:result.state.rideTime,run:result.run,rank:result.state.raceResult,errors}));
 await page.click('#view');await page.evaluate(()=>{for(let i=0;i<100;i++)sliceTest.update(.02);});await page.screenshot({path:'checks/'+course+'-layout.png'});await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
