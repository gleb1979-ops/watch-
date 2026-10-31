/* One continuous, playable waterpark attraction. Local Three.js and generated artwork. */
(async function(){
'use strict';
const T=window.THREE,$=id=>document.getElementById(id),UP=new T.Vector3(0,1,0);
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){$('error').hidden=false;return;}
const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),software=debug?/swiftshader|llvmpipe|software/i.test(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))):false;renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
$('scene').appendChild(renderer.domElement);
const scene=new T.Scene();scene.fog=new T.Fog(0xbfe8e1,65,130);
const camera=new T.PerspectiveCamera(52,1,.1,180);
scene.add(new T.HemisphereLight(0xf3ffff,0x658f64,2.25));
const sun=new T.DirectionalLight(0xffe6ae,2.6);sun.position.set(-25,40,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:100});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);

function loadImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(src));i.src=src;});}
let art,clothes,props;
try{[art,clothes,props]=await Promise.all(['assets/track-materials-v9.webp','assets/avatar-clothes-v10.webp','assets/ride-props-v8.webp'].map(loadImage));}
catch(e){$('error').hidden=false;$('error').textContent='Не загрузились рисунки аквапарка. Обнови страницу.';return;}
function tile(image,col,row,cols,rows,repeatX=1,repeatY=1){const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(image,col*image.width/cols,row*image.height/rows,image.width/cols,image.height/rows,0,0,256,256);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}
const materialCache=new Map();
function mat(color,options={}){if(!Object.keys(options).length){if(!materialCache.has(color))materialCache.set(color,new T.MeshStandardMaterial({color,roughness:.65}));return materialCache.get(color);}return new T.MeshStandardMaterial({color,roughness:.65,...options});}
const cream=mat(0xffecc5),rail=mat(0xffd66d,{roughness:.3,metalness:.15}),steel=mat(0x8ac2b9,{metalness:.35,roughness:.4}),wood=mat(0xa37142),green=mat(0x42a55f),leafLight=mat(0x73c762),white=mat(0xfff8e7);
function mesh(geometry,material,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
function box(w,h,d,material,x,y,z,parent=scene){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z,parent);}
function ball(r,material,x,y,z,parent=scene){return mesh(new T.SphereGeometry(r,16,10),material,x,y,z,parent);}
function bar(a,b,r,material,parent=scene){const dir=b.clone().sub(a),m=mesh(new T.CylinderGeometry(r,r,dir.length(),8),material,0,0,0,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,dir.normalize());return m;}
function v(x,y,z){return new T.Vector3(x,y,z);}
function markInteractive(object){object.traverse(o=>o.userData.ride=true);return object;}
// Deck, grass, tiled pool and a low wall define an actual human-scale place.
box(140,.4,140,mat(0x7fb95e),0,-.6,0);
const deck=box(56,.24,60,mat(0xf0d49a),0,-.14,1);
const gridPoints=[];for(let x=-28;x<=28;x+=2)gridPoints.push(x,.004,-29,x,.004,31);for(let z=-29;z<=31;z+=2)gridPoints.push(-28,.004,z,28,.004,z);
const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(gridPoints,3));scene.add(new T.LineSegments(gg,new T.LineBasicMaterial({color:0xdab985,transparent:true,opacity:.45})));
for(const z of [-29,31])box(57,.3,.6,cream,0,.06,z);
for(const x of [-28,28])box(.6,.3,60,cream,x,.06,1);
const poolWater=tile(art,0,0,4,2,3,4),poolMat=mat(0x43d9e9,{map:poolWater,roughness:.18,metalness:.1,transparent:true,opacity:.91});
box(12,.5,14,mat(0x249ead),12,-.05,22);
const pool=mesh(new T.PlaneGeometry(12,14,24,28),poolMat,12,.22,22);pool.rotation.x=-Math.PI/2;
for(const x of [5.7,18.3])box(.6,.38,14.8,cream,x,.14,22);
for(const z of [14.7,29.3])box(13.2,.38,.6,cream,12,.14,z);
// Pool exit steps, and rails visibly leading onto the dry deck.
for(let i=0;i<4;i++)box(.5,.16,2.4,white,5.8+i*.42,.12-i*.15,24);
for(const z of [22.6,25.4]){bar(v(4.8,0,z),v(4.8,1.15,z),.055,steel);bar(v(4.8,1.15,z),v(7.2,.55,z),.055,steel);}
const poolRings=[];for(let i=0;i<5;i++){const r=mesh(new T.TorusGeometry(.6,.035,5,48),mat(0xd4ffff,{transparent:true,opacity:.4}),10,.24,19+i*1.5);r.rotation.x=Math.PI/2;poolRings.push(r);}
// Palm trees, flower beds, shade, loungers: decoration stays outside walking routes.
function palm(x,z,height,seed){const group=new T.Group();scene.add(group);group.position.set(x,0,z);bar(v(0,0,0),v(.3,height,0),.22,wood,group);for(let i=0;i<7;i++){const a=i*Math.PI*2/7+seed;const points=[v(.3,height,0),v(Math.cos(a)*1.2,height+.45,Math.sin(a)*1.2),v(Math.cos(a)*3,height-.7,Math.sin(a)*3)];const curve=new T.CatmullRomCurve3(points);const pos=[],indices=[];for(let j=0;j<=12;j++){const t=j/12,p=curve.getPoint(t),width=Math.sin(Math.PI*t)*.48*(j%2?.72:1);for(const side of [-1,1])pos.push(p.x-Math.sin(a)*width*side,p.y,p.z+Math.cos(a)*width*side);if(j<12){const k=j*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}}const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute(pos,3));shape.setIndex(indices);shape.computeVertexNormals();const leaves=i%2?green:leafLight;leaves.side=T.DoubleSide;mesh(shape,leaves,0,0,0,group);bar(points[0],points[2],.023,leafLight,group);}
for(let i=0;i<3;i++)ball(.22,mat(0x8a693e),Math.cos(i*2)*.25,height-.35,Math.sin(i*2)*.25,group);}
[[-25,10,8],[-25,-23,9],[24,-24,9],[24,5,8],[24,29,10],[-8,30,8],[-25,29,7]].forEach((p,i)=>palm(...p,i));
for(const [x,z]of [[-25,10],[-25,-23],[24,-24],[24,5],[24,29],[-8,30],[-25,29]]){box(4,.35,4,cream,x,.05,z);for(let i=0;i<5;i++){const a=i*2.4;ball(.6,i%2?green:leafLight,x+Math.cos(a)*1.1,.5,z+Math.sin(a)*1.1);ball(.17,mat([0xffa2ac,0xffd45c,0xff8060][i%3]),x+Math.cos(a)*1.3,.95,z+Math.sin(a)*1.3);}}
function umbrella(x,z){bar(v(x,0,z),v(x,4,z),.08,wood);mesh(new T.ConeGeometry(2.5,.8,12),mat(0xf5b55d),x,4,z);for(const dx of [-1.3,1.3]){const g=new T.Group();g.position.set(x+dx,.32,z+1.1);scene.add(g);box(.85,.12,2.3,white,0,0,0,g);box(.72,.06,2.15,mat(0x52bbbc),0,.09,0,g);const back=box(.85,.12,1,white,0,.4,-1,g);back.rotation.x=-.65;for(const dz of [-.65,.65])bar(v(-.3,-.28,dz),v(.3,-.28,dz),.07,steel,g);}}
umbrella(-10,25);umbrella(23,16);
// Two real stair flights, landings, handrails and a platform, all in the same world.
const stairs=new T.Group();scene.add(stairs);
function flight(x,z0,z1,y0){for(let j=0;j<20;j++){const u=(j+1)/20,z=z0+(z1-z0)*u,y=y0+u*7;box(2.7,.2,.77,cream,x,y-.1,z,stairs);box(2.5,.055,.10,rail,x,y+.025,z+(z1>z0?-.30:.30),stairs);if(j%3===0)for(const side of [-1,1])bar(v(x+side*1.35,y,z),v(x+side*1.35,y+1.15,z),.045,steel,stairs);}
for(const side of [-1,1]){bar(v(x+side*1.35,y0+1.15,z0),v(x+side*1.35,y0+8.15,z1),.065,rail,stairs);bar(v(x+side*1.08,y0-.35,z0),v(x+side*1.08,y0+6.65,z1),.10,steel,stairs);}}
flight(-20,0,-14,0);flight(-16,-14,0,7);
box(6.7,.3,3.4,cream,-18,6.85,-14.7,stairs);box(9.8,.35,4.2,cream,-16.7,13.82,0,stairs);box(3.6,.35,2.1,cream,-10.5,13.82,1.05,stairs);
for(const x of [-21.2,-15,-12.8])for(const z of [-1.9,1.9]){bar(v(x,0,z),v(x,14,z),.16,steel,stairs);if(x!==-12.8)bar(v(x,14,z),v(x,18,z),.08,steel,stairs);}
for(const z of [-2,2]){bar(v(-21.3,15.15,z),v(-12,15.15,z),.065,rail,stairs);for(let x=-21;x<-12;x+=1.5)bar(v(x,14,z),v(x,15.15,z),.045,steel,stairs);}
for(const z of [-16.3,-13.1]){bar(v(-21.4,8.15,z),v(-14.5,8.15,z),.06,rail,stairs);for(let x=-21;x<-14.4;x+=1.5)bar(v(x,7,z),v(x,8.15,z),.045,steel,stairs);}
const canopy=mesh(new T.ConeGeometry(5.7,1.4,4),mat(0x38b6b3),-16.8,18.5,0,stairs);canopy.rotation.y=Math.PI/4;canopy.scale.z=.56;
markInteractive(stairs);
// A one-and-a-half turn flume. The same curve drives the geometry and rider.
const curvePoints=[];for(let i=0;i<=96;i++){const t=i/96,a=Math.PI+t*Math.PI*3;curvePoints.push(v(10*Math.cos(a),14-12*t,10*Math.sin(a)));}
curvePoints.push(v(10,1.5,4),v(10,.9,10),v(10,.55,18));
const track=new T.CatmullRomCurve3(curvePoints);const length=track.getLength();
function trackFrame(t){t=T.MathUtils.clamp(t,0,1);const p=track.getPointAt(t),f=track.getTangentAt(t).normalize(),right=new T.Vector3().crossVectors(f,UP).normalize();return{p,f,right};}
function flume(water=false){const n=360,m=water?6:20,positions=[],uv=[],indices=[];for(let i=0;i<=n;i++){const f=trackFrame(i/n);for(let j=0;j<=m;j++){const a=(j/m-.5)*(water?.98:Math.PI*1.05),r=1.48;const p=f.p.clone().addScaledVector(f.right,Math.sin(a)*r).addScaledVector(UP,r*(1-Math.cos(a))+(water?.055:0));positions.push(p.x,p.y,p.z);uv.push(j/m,i/n*length/5);if(i<n&&j<m){const k=i*(m+1)+j;indices.push(k,k+m+1,k+1,k+1,k+m+1,k+m+2);}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;}
const wallMap=tile(art,2,0,4,2),flowMap=tile(art,0,0,4,2);
const slideMesh=mesh(flume(),mat(0xffefdb,{map:wallMap,side:T.DoubleSide,roughness:.28}));markInteractive(slideMesh);slideMesh.castShadow=true;slideMesh.receiveShadow=true;
const flow=mesh(flume(true),mat(0x85ebf0,{map:flowMap,side:T.DoubleSide,transparent:true,opacity:.78,roughness:.15,depthWrite:false}));markInteractive(flow);
for(const side of [-1,1]){const ps=[];for(let i=0;i<=300;i++){const f=trackFrame(i/300);ps.push(f.p.addScaledVector(f.right,side*1.475).addScaledVector(UP,1.6));}const lip=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ps),320,.075,6,false),rail);markInteractive(lip);}
// Outside columns and cantilevers leave both overlapping flume turns completely clear.
const supports=[];
for(let i=0;i<=12;i++){const f=trackFrame(i/13),out=i/13<.85?v(f.p.x,0,f.p.z).normalize():v(1,0,0),foot=f.p.clone().addScaledVector(out,3.2);foot.y=0;const top=foot.clone();top.y=f.p.y-.25;bar(foot,top,.17,steel);bar(top,f.p.clone().addScaledVector(UP,-.25),.13,steel);box(1,.16,1,cream,foot.x,0,foot.z);supports.push({x:foot.x,z:foot.z,height:top.y});}
// White flume joints show the speed and changing perspective through turns.
const joints=[];for(let i=1;i<43;i++){const f=trackFrame(i/44),ps=[];for(let j=0;j<=18;j++){const a=(j/18-.5)*Math.PI*1.05;ps.push(f.p.clone().addScaledVector(f.right,Math.sin(a)*1.486).addScaledVector(UP,1.486*(1-Math.cos(a))+.01));}joints.push(...ps.flatMap((p,j)=>j? [...ps[j-1].toArray(),...p.toArray()]:[]));}
const jointGeo=new T.BufferGeometry();jointGeo.setAttribute('position',new T.Float32BufferAttribute(joints,3));scene.add(new T.LineSegments(jointGeo,new T.LineBasicMaterial({color:0xdcffff,transparent:true,opacity:.6})));
// Small floating 3D objects replace upright billboard rectangles.
const hazards=[{at:.24,lane:-.43,kind:1},{at:.43,lane:.43,kind:0},{at:.63,lane:0,kind:2},{at:.81,lane:-.43,kind:1}];
for(const h of hazards){const g=new T.Group();scene.add(g);h.mesh=g;g.userData.dynamic=true;
 if(h.kind===1){const yellow=mat(0xffd945),body=ball(.25,yellow,0,.18,0,g);body.scale.set(1,.7,1.25);ball(.16,yellow,0,.43,.16,g);box(.2,.075,.16,mat(0xff913e),0,.41,.32,g);for(const x of [-.11,.11])ball(.025,mat(0x173731),x,.48,.26,g);}
 else if(h.kind===0){mesh(new T.CylinderGeometry(.22,.26,.16,16),mat(0xff8649),0,.10,0,g);mesh(new T.CylinderGeometry(.225,.25,.055,16),white,0,.13,0,g);mesh(new T.ConeGeometry(.13,.24,12),mat(0xff8649),0,.30,0,g);}
 else{const packet=box(.34,.065,.45,mat(0xffda73,{map:tile(props,2,0,4,2)}),0,.10,0,g);packet.rotation.y=.35;}
 g.traverse(o=>o.userData.dynamic=true);
}
// Batch static scenery by material; moving water, rings and the child stay separate.
scene.updateMatrixWorld(true);
const buckets=new Map(),staticMeshes=[];
scene.traverse(o=>{if(o.isMesh&&!o.userData.dynamic&&!poolRings.includes(o)&&o!==pool&&o!==flow&&!Array.isArray(o.material)){const key=o.material.uuid+Boolean(o.userData.ride);if(!buckets.has(key))buckets.set(key,{material:o.material,ride:o.userData.ride,geometries:[]});const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());g.applyMatrix4(o.matrixWorld);buckets.get(key).geometries.push(g);staticMeshes.push(o);}});
for(const bucket of buckets.values()){const g=new T.BufferGeometry();for(const name of ['position','normal','uv']){if(!bucket.geometries.every(a=>a.getAttribute(name)))continue;const size=bucket.geometries[0].getAttribute(name).itemSize,n=bucket.geometries.reduce((sum,a)=>sum+a.getAttribute(name).array.length,0),out=new Float32Array(n);let offset=0;for(const a of bucket.geometries){out.set(a.getAttribute(name).array,offset);offset+=a.getAttribute(name).array.length;}g.setAttribute(name,new T.BufferAttribute(out,size));}g.computeBoundingSphere();const combined=mesh(g,bucket.material);combined.userData.ride=bucket.ride;combined.castShadow=true;combined.receiveShadow=true;bucket.geometries.forEach(g=>g.dispose());}
staticMeshes.forEach(o=>o.parent.remove(o));
const cameraBlockers=scene.children.filter(o=>o.isMesh&&o!==pool&&o!==flow&&!o.userData.dynamic);
// One child with articulated legs. He stays in the scene during every phase.
const rig=window.createTrapkinsRig(0,clothes);rig.root.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});scene.add(rig.root);rig.root.scale.setScalar(.55);
const shadow=mesh(new T.CircleGeometry(.60,24),mat(0x235b4c,{transparent:true,opacity:.18,depthWrite:false}),0,.018,0);shadow.rotation.x=-Math.PI/2;
const matGroup=new T.Group();scene.add(matGroup);const matBlue=mat(0xffc85b,{roughness:.55});
box(.86,.11,1.9,matBlue,0,0,0,matGroup);for(const x of [-.37,.37])box(.055,.04,1.65,white,x,.07,0,matGroup);const nose=mesh(new T.CylinderGeometry(.43,.43,.1,18),matBlue,0,0,.92,matGroup);nose.scale.z=.5;
const particles=[];for(let i=0;i<36;i++){const m=ball(.045+(i%4)*.02,mat(0xd9ffff,{transparent:true,opacity:.75}),0,-5,0);particles.push({mesh:m,angle:i*2.399,speed:1.8+(i%5)*.5});}
const wake=[];for(let i=0;i<16;i++)wake.push(ball(.045+(i%3)*.012,mat(0xdcffff,{transparent:true,opacity:.65}),0,-5,0));
const LANE_LIMIT=.55,FLUME_RADIUS=1.48;
const launchFrom=new T.Vector3(),splashFrom=new T.Vector3();
const boardRotation=new T.Quaternion(),riderRotation=new T.Quaternion();
const state={speed:0,rideTime:0,seat:0,roll:0,lean:0,pitch:0,mode:'menu',position:v(-14,0,9),heading:Math.PI,travel:0,phase:0,lane:0,laneSpeed:0,steps:0,score:0,bumps:0,walked:0,finished:false};
let paused=false,overview=true,autoTarget=null,route=[],clock=0,last=performance.now(),feedbackUntil=0,finishedAt=0,dragLane=null,dragUntil=0;
const held=new Set(),stairPath=[v(-20,0,0)];for(let j=1;j<=20;j++)stairPath.push(v(-20,j*.35,-j*.7));stairPath.push(v(-16,7,-14));for(let j=1;j<=20;j++)stairPath.push(v(-16,7+j*.35,-14+j*.7));stairPath.push(v(-13,14,1.35),v(-10,14,1.7));
let stairSegment=0;
function say(message){$('feedback').textContent=message;$('feedback').classList.add('visible');feedbackUntil=clock+3.2;}
function setMode(mode){state.mode=mode;document.body.dataset.mode=mode;document.body.classList.toggle('riding',mode==='ride');const step=mode==='walk'?'walk':mode==='climb'||mode==='platform'?'climb':mode==='ride'?'ride':'pool';document.querySelectorAll('[data-phase]').forEach(e=>e.classList.toggle('active',e.dataset.phase===step));$('instruction').textContent={walk:'Прогуляйся по площадке или отправляйся к лестнице.',climb:'Две лестницы, площадка наверху — и можно ехать.',platform:'Садимся на коврик. Сейчас поедем!',ride:'Рули влево-вправо. Объезжай утят, буйки и пакетик!',splash:'Плюх! Ещё немного — и обратно на площадку.',exit:'Выбираемся из бассейна по ступенькам.'}[mode]||'';$('controls').innerHTML=mode==='ride'?'<kbd>←</kbd> <kbd>→</kbd> или <kbd>A</kbd> <kbd>D</kbd> — рулить <b>·</b> мышь — влево / вправо':'<kbd>WASD</kbd> / стрелки — ходить <b>·</b> клик — идти <b>·</b> <kbd>E</kbd> — на горку';if(!['walk','ride'].includes(mode))$('controls').textContent=mode==='climb'?'Подъём по лестнице':mode==='platform'?'Садимся на коврик':'Возвращаемся на площадку';$('go').hidden=!['walk'].includes(mode);}
function start(){if(state.mode!=='menu')return;$('welcome').hidden=true;overview=false;setMode('walk');say('Нажми на лестницу или «На горку»');}
function go(){if(paused)return;if(state.mode==='menu')start();if(state.mode!=='walk')return;overview=false;state.finished=false;state.score=0;state.bumps=0;hazards.forEach(h=>{h.checked=false;h.pushed=0;});state.lane=0;state.laneSpeed=0;state.roll=0;state.lean=0;state.rideTime=0;navigate(v(-20,0,0));$('go').textContent='Идём к лестнице…';say('Идём ко входу. Дальше поднимемся по ступенькам.');}
function canWalk(p){return p.x>-26.5&&p.x<26.5&&p.z>-27.5&&p.z<29.8&&!(p.x>5.1&&p.x<19&&p.z>14.1&&p.z<29.8);}
// A small navigation grid routes walks around the pool instead of stopping at its edge.
function navigate(target){const width=55,height=58,N=width*height,point=k=>v(k%width-27,0,Math.floor(k/width)-28),valid=new Uint8Array(N);for(let k=0;k<N;k++)valid[k]=Number(canWalk(point(k)));function nearest(p){let best=-1,d=Infinity;for(let k=0;k<N;k++)if(valid[k]){const q=point(k).distanceToSquared(p);if(q<d){d=q;best=k;}}return best;}const a=nearest(state.position),b=nearest(target),previous=new Int32Array(N).fill(-1),queue=[a];previous[a]=a;for(let n=0;n<queue.length;n++){const k=queue[n];if(k===b)break;for(const delta of [-1,1,-width,width]){const next=k+delta;if(next<0||next>=N||!valid[next]||previous[next]>=0||Math.abs(next%width-k%width)>1)continue;previous[next]=k;queue.push(next);}}const points=[];if(previous[b]>=0){for(let k=b;k!==a;k=previous[k])points.push(point(k));points.push(point(a));points.reverse();}route=points.filter((p,i)=>i===0||i===points.length-1||Math.sign(p.x-points[i-1].x)!==Math.sign(points[i+1].x-p.x)||Math.sign(p.z-points[i-1].z)!==Math.sign(points[i+1].z-p.z));route.push(target.clone());autoTarget=route.shift();}
function moveTo(target,dt,speed=4.7){const d=target.clone().sub(state.position);d.y=0;const distance=d.length();if(distance<.09)return true;const step=Math.min(distance,speed*dt),next=state.position.clone().addScaledVector(d.normalize(),step);if(canWalk(next)){state.position.copy(next);state.walked+=step;state.heading=Math.atan2(d.x,d.z);state.walking=true;}return distance<=step+.05;}
function walking(dt){state.walking=false;let x=Number(held.has('ArrowRight')||held.has('d'))-Number(held.has('ArrowLeft')||held.has('a')),z=Number(held.has('ArrowUp')||held.has('w'))-Number(held.has('ArrowDown')||held.has('s'));
if(x||z){autoTarget=null;route=[];$('go').innerHTML='На горку <span>→</span>';const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();const right=new T.Vector3().crossVectors(forward,UP).normalize();const direction=right.multiplyScalar(x).addScaledVector(forward,z).normalize();moveTo(state.position.clone().addScaledVector(direction,5),dt);}
else if(autoTarget&&moveTo(autoTarget,dt)){autoTarget=route.shift()||null;if(!autoTarget&&state.position.distanceTo(stairPath[0])<.3){state.position.copy(stairPath[0]);stairSegment=1;setMode('climb');say('Поднимаемся по лестнице');}}
if(state.mode==='walk'&&!autoTarget&&state.walking&&state.position.distanceTo(stairPath[0])<.75){stairSegment=1;setMode('climb');}
}
function climb(dt){state.walking=true;const target=stairPath[stairSegment],d=target.clone().sub(state.position),distance=d.length(),speed=3.4,step=Math.min(distance,dt*speed);state.position.addScaledVector(d.normalize(),step);state.walked+=step;state.heading=Math.atan2(d.x,d.z);state.steps=stairSegment;if(distance<=step+.005){state.position.copy(target);stairSegment++;if(stairSegment>=stairPath.length){setMode('platform');state.phase=0;launchFrom.copy(state.position);state.walking=false;}}$('progress').style.width=(stairSegment/stairPath.length*28)+'%';}
function riding(dt){
 camera.updateMatrixWorld();const visualRight=trackFrame(state.phase).right.dot(new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0))>=0?1:-1;
 const input=(Number(held.has('d')||held.has('ArrowRight'))-Number(held.has('a')||held.has('ArrowLeft')))*visualRight;
 const wanted=input*1.65||((dragLane!=null&&clock<dragUntil)?T.MathUtils.clamp((dragLane*visualRight-state.lane)*6,-1.65,1.65):0);
 state.laneSpeed+=(wanted-state.laneSpeed)*(1-Math.exp(-8*dt));state.lane=T.MathUtils.clamp(state.lane+state.laneSpeed*dt,-LANE_LIMIT,LANE_LIMIT);
 if(Math.abs(state.lane)===LANE_LIMIT&&Math.sign(state.laneSpeed)===Math.sign(state.lane))state.laneSpeed*=Math.exp(-14*dt);
 const before=trackFrame(state.phase),targetSpeed=21+Math.max(0,-before.f.y)*12;
 state.speed+=(targetSpeed-state.speed)*(1-Math.exp(-1.3*dt));state.rideTime+=dt;state.phase=Math.min(1,state.phase+state.speed*dt/length);
 const f=trackFrame(state.phase),bank=FLUME_RADIUS-Math.sqrt(FLUME_RADIUS**2-state.lane**2);
 state.position.copy(f.p).addScaledVector(f.right,state.lane).addScaledVector(UP,bank+.15);state.heading=Math.atan2(f.f.x,f.f.z);
 const ahead=trackFrame(Math.min(1,state.phase+.012)),bend=f.f.x*ahead.f.z-f.f.z*ahead.f.x;
 const targetRoll=-Math.asin(state.lane/FLUME_RADIUS),targetLean=T.MathUtils.clamp(-state.laneSpeed*.11+bend*state.speed*.06,-.23,.23);
 state.roll+=(targetRoll-state.roll)*(1-Math.exp(-12*dt));state.lean+=(targetLean-state.lean)*(1-Math.exp(-9*dt));state.pitch=Math.atan2(-f.f.y,Math.hypot(f.f.x,f.f.z));
 for(const h of hazards)if(!h.checked&&state.phase>=h.at){h.checked=true;if(Math.abs(state.lane-h.lane)<.29){state.bumps++;h.pushed=state.lane>=h.lane?-1:1;h.pushedAt=clock;state.speed*=.97;say(h.kind===2?'Шурх! Пакетик уплыл в сторону.':'Брызги! Попробуй объехать следующее.');}else{state.score+=100;say('Ловкий манёвр! +100');}}
 $('progress').style.width=(28+state.phase*65)+'%';
 if(state.phase>=1){splashFrom.copy(state.position);setMode('splash');state.phase=0;finishedAt=clock;say('ПЛЮХ! Ты проехал всю спираль.');}
}
const boardContacts=[[-.43,-.95],[.43,-.95],[-.43,.95],[.43,.95],[0,1.135],[-.30,1.07],[.30,1.07]];
function boardClearance(){let minimum=Infinity;for(const [x,z]of boardContacts){const p=v(x,-.055,z).applyQuaternion(matGroup.quaternion).add(matGroup.position);let t=state.phase;for(let i=0;i<3;i++){const f=trackFrame(t),dx=p.x-f.p.x,dz=p.z-f.p.z;t=T.MathUtils.clamp(t+(dx*f.f.x+dz*f.f.z)/(length*(f.f.x**2+f.f.z**2)),0,1);}const f=trackFrame(t),side=Math.abs(p.clone().sub(f.p).dot(f.right)),floor=FLUME_RADIUS-Math.sqrt(Math.max(0,FLUME_RADIUS**2-side**2));minimum=Math.min(minimum,p.y-f.p.y-floor);}return minimum;}
function pose(dt){
 const seated=['platform','ride','splash'].includes(state.mode),swimming=state.mode==='exit';
 state.seat=T.MathUtils.damp(state.seat,seated?1:0,7,dt);
 rig.root.position.copy(state.position);
 const pitch=state.mode==='ride'?state.pitch:0,roll=state.mode==='ride'?state.roll:0;
 boardRotation.setFromEuler(new T.Euler(pitch,state.heading,roll,'YXZ'));
 riderRotation.copy(boardRotation).multiply(new T.Quaternion().setFromAxisAngle(v(0,0,1),state.mode==='ride'?state.lean:0));
 rig.root.quaternion.slerp(riderRotation,1-Math.exp(-18*dt));rig.root.position.add(v(0,-.65*state.seat,0).applyQuaternion(rig.root.quaternion));
 rig.body.position.y=state.walking?Math.abs(Math.sin(state.walked*6))*.035*(1-state.seat):0;
 rig.body.rotation.x=-.08*state.seat;rig.body.rotation.z=0;
 for(let i=0;i<2;i++){const p=state.walked*3.4+i*Math.PI,swing=state.walking?Math.sin(p)*.42:0,blend=state.seat;
 rig.legs[i].joint.rotation.x=T.MathUtils.lerp(swimming?-.6:swing,-1.35,blend);
 rig.legs[i].knee.rotation.x=T.MathUtils.lerp(Math.max(0,-swing)*.8,.18,blend);
 rig.legs[i].foot.rotation.x=T.MathUtils.lerp(-swing*.4,.25,blend);
 rig.arms[i].joint.rotation.x=T.MathUtils.lerp(swimming?Math.sin(clock*5+i*Math.PI)*.8:-swing*.85,-.7+Math.sin(clock*2+i)*.035,blend);rig.arms[i].elbow.rotation.x=-.2;}
 matGroup.visible=state.seat>.05;matGroup.quaternion.slerp(boardRotation,1-Math.exp(-20*dt));matGroup.position.copy(state.position).add(v(0,.08,0).applyQuaternion(matGroup.quaternion));
 if(state.mode==='ride'){const lift=Math.max(0,.035-boardClearance());state.boardLift=lift;state.position.y+=lift;matGroup.position.y+=lift;rig.root.position.y+=lift;}
 shadow.visible=state.mode==='walk';shadow.position.set(state.position.x,.025,state.position.z);
 wake.forEach((m,i)=>{m.visible=state.mode==='ride';if(m.visible){const f=trackFrame(Math.max(0,state.phase-(.7+(i%8)*.22)/length)),side=state.lane+(i<8?-1:1)*(.35+Math.sin(clock*16+i)*.08);m.position.copy(f.p).addScaledVector(f.right,side).addScaledVector(UP,.08+Math.sin(clock*12+i)*.025);}});
}
function update(dt){clock+=dt;if(clock>feedbackUntil)$('feedback').classList.remove('visible');flowMap.offset.y=-clock*.65;poolWater.offset.set(Math.sin(clock*.13)*.08,-clock*.025);for(let i=0;i<poolRings.length;i++){const r=poolRings[i],s=.4+((clock*.4+i*.3)%1)*1.7;r.scale.set(s,s,s);r.material.opacity=.25*(1-(s-.4)/1.7);}
for(const h of hazards){const push=h.pushed?T.MathUtils.smoothstep(clock-h.pushedAt,0,.6):0,f=trackFrame(h.at),lane=h.lane+(h.pushed||0)*push*.48,bank=FLUME_RADIUS-Math.sqrt(FLUME_RADIUS**2-lane**2);h.mesh.position.copy(f.p).addScaledVector(f.right,lane).addScaledVector(UP,bank+.08+Math.sin(clock*3+h.at)*.025);h.mesh.rotation.set(0,Math.sin(clock*1.2+h.at)*.1+push*2,Math.sin(clock*2+h.at)*.04);}
if(state.mode==='walk')walking(dt);else if(state.mode==='climb')climb(dt);else if(state.mode==='platform'){state.phase+=dt;const turn=T.MathUtils.smoothstep(state.phase,0,.65),end=track.getPointAt(0).addScaledVector(UP,.15),glide=T.MathUtils.clamp((state.phase-.55)/.85,0,1)**2;state.position.lerpVectors(launchFrom,end,glide);const desiredHeading=Math.atan2(trackFrame(0).f.x,trackFrame(0).f.z);state.heading+=((desiredHeading-state.heading+Math.PI*3)%(Math.PI*2)-Math.PI)*turn*(1-Math.exp(-10*dt));if(state.phase>=1.4){state.position.copy(end);state.phase=0;state.speed=4;state.rideTime=0;state.lane=0;state.laneSpeed=0;dragLane=null;setMode('ride');say('Рули ← →. Держись за коврик!');}}
else if(state.mode==='ride')riding(dt);else if(state.mode==='splash'){state.phase+=dt;const settle=T.MathUtils.smoothstep(state.phase,0,1.4);state.position.lerpVectors(splashFrom,v(10,-.15,20.1),settle);if(state.phase>1.4){state.phase=0;setMode('exit');}}
else if(state.mode==='exit'){state.phase=Math.min(1,state.phase+dt*.33);state.position.set(10-5.6*state.phase,-.5+Math.max(0,state.phase-.68)/.32*.5,20.1+state.phase*3.9);state.heading=-Math.PI/2;if(state.phase===1){state.finished=true;state.position.y=0;setMode('walk');$('go').innerHTML='Ещё круг <span>→</span>';$('instruction').textContent='Круг пройден! Можно погулять или прокатиться ещё раз.';$('progress').style.width='100%';say('Полный круг! '+state.score+' очков за манёвры.');}}
particles.forEach((p,i)=>{const t=clock-finishedAt;p.mesh.visible=state.mode==='splash'&&t<1.5;if(p.mesh.visible){p.mesh.position.set(10+Math.cos(p.angle)*p.speed*t,.35+p.speed*t-3*t*t,18+Math.sin(p.angle)*p.speed*t);p.mesh.material.opacity=Math.max(0,.8-t*.5);}});pose(dt);}
const desired=new T.Vector3(),lookTarget=new T.Vector3(),smoothLook=v(0,5,0);
function rideCamera(t){const f=trackFrame(t),back=Math.max(0,t-5.8/length);desired.copy(track.getPointAt(back)).addScaledVector(UP,3.2);if(t<5.8/length)desired.addScaledVector(trackFrame(0).f,-(5.8-t*length));lookTarget.copy(f.p).addScaledVector(f.f,2.4).addScaledVector(UP,.8);}
function cameraUpdate(dt){
 if(overview||state.mode==='menu'){desired.set(39,30,43);lookTarget.set(-1,6,1);}
 else if(state.mode==='ride')rideCamera(state.phase);
 else if(state.mode==='platform'){const blend=T.MathUtils.smoothstep(state.phase,0,1.2),start=state.position.clone().add(v(8,5.5,10));rideCamera(0);desired.lerpVectors(start,desired.clone(),blend);lookTarget.lerpVectors(state.position.clone().add(v(0,1,0)),lookTarget.clone(),blend);}
 else if(state.mode==='climb'){desired.copy(state.position).add(v(8,5.5,10));lookTarget.copy(state.position).add(v(0,1.3,0));}
 else if(['splash','exit'].includes(state.mode)){desired.copy(state.position).add(v(6,5,8));lookTarget.copy(state.position).add(v(0,.6,0));}
 else{desired.copy(state.position).add(v(12,10,16));lookTarget.copy(state.position).add(v(0,1.6,0));}
 const follow=state.mode==='ride'?16:state.mode==='platform'?6:4,a=1-Math.exp(-dt*follow);camera.position.lerp(desired,a);smoothLook.lerp(lookTarget,a);camera.lookAt(smoothLook);
 const fov=state.mode==='ride'?52+T.MathUtils.clamp((state.speed-4)*.45,0,9):52;camera.fov=T.MathUtils.damp(camera.fov,fov,4,dt);camera.updateProjectionMatrix();
}
camera.position.set(39,30,43);camera.lookAt(smoothLook);
function resize(){renderer.setPixelRatio(software?Math.min(1,1000/innerWidth,700/innerHeight):Math.min(devicePixelRatio,1.5));camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
function render(time){const dt=Math.min((time-last)/1000,.05);last=time;if(!paused){update(dt);cameraUpdate(dt);}renderer.render(scene,camera);requestAnimationFrame(render);}
requestAnimationFrame(render);
function keyName(e){return({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e'})[e.code]||e.key;}
addEventListener('keydown',e=>{const k=keyName(e);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(k))e.preventDefault();held.add(k);if(!e.repeat){if(k==='e'||k==='Enter')go();if(k==='Escape')togglePause();}});addEventListener('keyup',e=>held.delete(keyName(e)));addEventListener('blur',()=>held.clear());
function togglePause(){if(state.mode==='menu')return;paused=!paused;$('pause').textContent=paused?'Дальше':'Пауза';if(paused){$('feedback').textContent='Пауза';$('feedback').classList.add('visible');}else say('Продолжаем');}
$('pause').onclick=togglePause;$('start').onclick=start;$('go').onclick=go;
$('view').onclick=()=>{overview=!overview;$('view').textContent=overview?'К герою':'Весь участок';};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(e){say('В этом браузере полный экран недоступен');}};
const ray=new T.Raycaster(),pointer=new T.Vector2(),groundPlane=new T.Plane(UP,0);
function pointFromEvent(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(groundPlane,new T.Vector3());}
renderer.domElement.addEventListener('pointerdown',e=>{if(paused)return;if(state.mode==='ride'){dragLane=T.MathUtils.clamp((e.clientX/innerWidth-.5)*2.5,-.9,.9);dragUntil=clock+2;return;}if(state.mode!=='walk')return;const p=pointFromEvent(e),hit=ray.intersectObjects(scene.children,true).find(h=>h.object.userData.ride);if(hit){go();return;}if(p&&canWalk(p)){navigate(p);overview=false;say('Идём сюда');}});
renderer.domElement.addEventListener('pointermove',e=>{if(state.mode==='ride'){dragLane=T.MathUtils.clamp((e.clientX/innerWidth-.5)*2.5,-.9,.9);dragUntil=clock+2;}});
renderer.domElement.addEventListener('pointerleave',()=>dragLane=null);
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.key);});for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,()=>held.delete(b.dataset.key));});
$('start').disabled=false;$('start').textContent='Попробовать →';
// Read-only diagnostics plus time stepping for browser regression checks.
window.sliceTest={get state(){return{...state,position:state.position.toArray(),camera:camera.position.toArray(),feet:rig.legs.map(l=>{const p=l.foot.getWorldPosition(new T.Vector3()).project(camera);return{x:p.x,y:p.y,visible:Math.abs(p.x)<1&&Math.abs(p.y)<1};})};},get ready(){return true;},update(dt){update(dt);cameraUpdate(dt);},get drawCalls(){return renderer.info.render.calls;},get screen(){camera.updateMatrixWorld();const hero=state.position.clone().project(camera),center=track.getPointAt(Math.min(1,state.phase)).project(camera);return{heroX:hero.x,centerX:center.x};},get cameraBlocked(){camera.updateMatrixWorld();const target=state.position.clone().addScaledVector(UP,.6),d=target.clone().sub(camera.position),ray=new T.Raycaster(camera.position,d.clone().normalize(),.08,Math.max(.1,d.length()-.5));return ray.intersectObjects(cameraBlockers,false).length>0;},get supports(){return supports;},get board(){return matGroup;},get clearance(){return boardClearance();},get length(){return length;},get track(){return track;},get rig(){return rig;}};
})();
