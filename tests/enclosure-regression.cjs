const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{for(const course of (process.env.COURSE?[process.env.COURSE]:['kamikaze','flush','tunnel'])){
  const page=await browser.newPage({viewport:{width:1000,height:700}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/?course='+course);await page.waitForFunction(()=>window.sliceTest?.ready);
  const geometry=await page.evaluate(()=>{const g=sliceTest,T=THREE;let continuity=1;for(let i=1;i<=2400;i++)continuity=Math.min(continuity,g.frame((i-1)/2400).right.dot(g.frame(i/2400).right));let roofHit=false;if(g.roof){const f=g.frame(.235),ray=new T.Raycaster(f.p.clone().add(new T.Vector3(0,1,0)),new T.Vector3(0,1,0),0,5);roofHit=ray.intersectObject(g.roof).length>0;}return{palms:g.palmClearances,continuity,roofHit};});
  assert(geometry.palms.length&&geometry.palms.every(Boolean),'Palm intersects ride');
  if(course==='kamikaze')assert(geometry.continuity>.99,'Tube frame jumps: '+geometry.continuity);
  if(course==='flush')assert(geometry.roofHit,'Tunnel has no solid ceiling');
  await page.click('#start');await page.click('#go');await page.click('#pause');
  let enclosedShot=false,drainShot=false,finished=false;
  for(let i=0;i<500;i++){
   const s=await page.evaluate(()=>{const count=sliceTest.state.mode==='ride'&&sliceTest.state.phase>sliceTest.dropStart-.04?3:20;for(let j=0;j<count;j++){sliceTest.update(.02);const s=sliceTest.state,e=sliceTest.effects;window.epic??={dropTime:0,top:0,bottom:100,maxFov:0,particles:0,rings:0,escaped:0};if(s.mode==='ride'&&s.phase>=sliceTest.dropStart){epic.dropTime+=.02;epic.top=Math.max(epic.top,s.position[1]);epic.bottom=Math.min(epic.bottom,s.position[1]);epic.maxFov=Math.max(epic.maxFov,e.fov);}if(sliceTest.course==='kamikaze'&&s.mode==='ride'&&s.phase>.03&&s.phase<.97&&!sliceTest.cameraEnclosed)epic.escaped++;epic.particles=Math.max(epic.particles,e.particles);epic.rings=Math.max(epic.rings,e.rings);}return sliceTest.state;});
   assert(s.position.every(Number.isFinite)&&s.camera.every(Number.isFinite),'Invalid ride position');
   if(s.mode==='ride'&&s.phase>.23&&!enclosedShot){await page.screenshot({path:'checks/'+course+'-enclosure.png'});enclosedShot=true;}
   if(course==='flush'&&s.mode==='ride'&&Math.hypot(s.position[0]-12,s.position[2]-22)<2.5&&s.position[1]<10&&!drainShot){await page.screenshot({path:'checks/flush-drain.png'});drainShot=true;}
   if(s.finished){finished=true;break;}
  }
  assert(finished,'Route did not finish: '+course);assert(enclosedShot);if(course==='flush')assert(drainShot);
  const epic=await page.evaluate(()=>window.epic);if(course==='kamikaze')assert.equal(epic.escaped,0,'Camera left the enclosed tube');if(course==='flush'){assert(epic.top-epic.bottom>8,'Drop too short');assert(epic.dropTime>.5,'Drop too abrupt');assert(epic.maxFov>78,'Missing plunge camera');assert(epic.particles===100&&epic.rings===3,'Missing impact effects');}assert.deepEqual(errors,[]);console.log(JSON.stringify({course,...geometry,finished,drainShot,epic,errors}));await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
