/* Local park economy, activities and animated pools. No external services. */
window.createParkLife = function ({T, scene, state, held, rig, say, setMode, navigate, courseId, courseName, camera, renderer, extra, track, onStart, stopNavigation}) {
  const KEY = 'trapkins-park-v1', $ = id => document.getElementById(id), v = (x,y,z) => new T.Vector3(x,y,z);
  const menu = [
    {id:'hotdog',name:'Хотдог',price:120,color:0xffa74b},
    {id:'burger',name:'Гамбургер',price:180,color:0xf0ba47},
    {id:'pizza',name:'Пицца',price:220,color:0xe86b57},
    {id:'lemonade',name:'Лимонад',price:60,color:0x6bcfd4}
  ];
  let data = {wallet:0,name:'Игрок',records:[],inventory:{},energy:0,skin:'classic'};
  try {
    const saved=JSON.parse(localStorage.getItem(KEY));
    if(saved && typeof saved==='object') {
      data.wallet=Number.isSafeInteger(saved.wallet)&&saved.wallet>=0?saved.wallet:0;
      data.name=typeof saved.name==='string'?saved.name.slice(0,16):'Игрок';
      data.records=Array.isArray(saved.records)?saved.records.filter(r=>r&&typeof r.name==='string'&&typeof r.course==='string'&&Number.isFinite(r.points)&&r.points>=0&&Number.isFinite(r.time)&&r.time>0&&Number.isFinite(r.speed)&&r.speed>=0).slice(0,30):[];
      for(const item of menu) data.inventory[item.id]=Number.isSafeInteger(saved.inventory?.[item.id])&&saved.inventory[item.id]>=0?saved.inventory[item.id]:0;
      data.skin=['classic','duck','pineapple','space','neon'].includes(saved.skin)?saved.skin:'classic';
      data.energy=Number.isInteger(saved.energy)?T.MathUtils.clamp(saved.energy,0,3):0;
    }
  } catch {}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}refreshBoard();refreshWallet();};
  const material=color=>new T.MeshStandardMaterial({color,roughness:.55});
  const cream=material(0xffedc5),red=material(0xec654c),wood=material(0x9f6740),white=material(0xffffff);
  const add=(g,m,x=0,y=0,z=0,parent=scene)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
  const box=(w,h,d,m,x,y,z,parent)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,parent);
  const sphere=(r,m,x,y,z,parent)=>add(new T.SphereGeometry(r,12,8),m,x,y,z,parent);
  function label(text,x,y,z,width=5,yaw=0) {
    const c=document.createElement('canvas');c.width=768;c.height=160;
    const ctx=c.getContext('2d');ctx.fillStyle='#123d50';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#f8f4d5';ctx.textAlign='center';ctx.font='bold 76px Arial';ctx.fillText(text,384,108);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
    const mat=new T.MeshBasicMaterial({map:texture});const front=add(new T.PlaneGeometry(width,width*160/768),mat,x,y,z);front.rotation.y=yaw;
    const back=add(front.geometry,mat,x,y,z);back.rotation.y=yaw+Math.PI;back.position.add(v(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(-.03));return [front,back];
  }
  const guards=window.createLifeguards({T,scene});guards.register(courseId,courseName,v(-13.8,14,-1.3),{queueOffset:v(.4,0,1.6),queueStep:v(.7,0,0)});let parkOverview=false,mapZoom=1,selfieFocus=false,waitingAnnounced=false,lastPhoto=null,waitingRoute=null;
  const layout=window.createParkLayout({T,scene,extra,track,courseId,guards,onEnter:entry=>travel(entry.point,()=>{if(entry.current){onStart();return;}waitingRoute=entry;say('Спасатель готовит вход на горку.');},'Идём ко входу: '+entry.name)});
  const boardCanvas=document.createElement('canvas');boardCanvas.width=1280;boardCanvas.height=768;
  const boardTexture=new T.CanvasTexture(boardCanvas);boardTexture.colorSpace=T.SRGBColorSpace;
  const boardMat=new T.MeshBasicMaterial({map:boardTexture});
  for(const yaw of [0,Math.PI]) {const board=add(new T.PlaneGeometry(15,9),boardMat,18,7,49.1+(yaw?-.21:.21));board.rotation.y=yaw;board.userData.parkAction='records';}
  box(15.8,9.8,.3,wood,18,7,49.1);for(const x of [11,25])box(.5,3,.5,wood,x,1.5,49);
  function refreshBoard() {
    const ctx=boardCanvas.getContext('2d');ctx.fillStyle='#0b2639';ctx.fillRect(0,0,1280,768);ctx.fillStyle='#8bf6e1';ctx.font='bold 64px Arial';ctx.fillText('TRAPKINS · РЕКОРДЫ ПАРКА',45,85);ctx.fillStyle='#e8f6f6';ctx.font='30px Arial';ctx.fillText('Результаты игроков в этом браузере',45,135);
    ctx.font='bold 30px Arial';ctx.fillStyle='#ffda82';ctx.fillText('ИГРОК / ГОРКА',45,205);ctx.fillText('ОЧКИ',850,205);ctx.fillText('КМ/Ч',1060,205);
    const records=ranked().slice(0,6);ctx.font='30px Arial';
    records.forEach((r,i)=>{const y=275+i*68;ctx.fillStyle=i===0?'#ffe191':'#e5f4f1';ctx.fillText((i+1)+'. '+r.name.slice(0,16)+' · '+r.course.slice(0,21),45,y);ctx.fillText(String(r.points),850,y);ctx.fillText(String(Math.round(r.speed)),1060,y);});
    if(!records.length){ctx.fillStyle='#eef6f2';ctx.font='36px Arial';ctx.fillText('Прокатись с горки — стань первым!',65,335);}
    ctx.fillStyle='#8bf6e1';ctx.font='28px Arial';ctx.fillText('SHIFT / кнопка «Разгон» · скорость приносит очки',45,724);boardTexture.needsUpdate=true;
  }
  function ranked(){return [...data.records].sort((a,b)=>b.points-a.points||b.speed-a.speed||a.time-b.time);}
  const pools=[
    {id:'waves',name:'Волновой бассейн',x:-12,z:66,w:28,d:24,color:0x38cbe7,entry:v(-28,0,66)},
    {id:'cold',name:'Холодный бассейн',x:24,z:103,w:30,d:24,color:0x76c7fa,entry:v(7,0,103)}
  ];
  for(const p of pools) {
    box(p.w+1,.3,p.d+1,cream,p.x,-1.4,p.z);box(p.w,.2,p.d,material(0x258cba),p.x,-1.15,p.z);
    const g=new T.PlaneGeometry(p.w,p.d,28,24);g.rotateX(-Math.PI/2);
    p.water=add(g,new T.MeshStandardMaterial({color:p.color,roughness:.18,metalness:.22,transparent:true,opacity:.91}),p.x,.25,p.z);p.water.userData.parkAction='pool:'+p.id;
    const ripples=document.createElement('canvas');ripples.width=ripples.height=256;const waterCtx=ripples.getContext('2d');waterCtx.fillStyle=new T.Color(p.color).getStyle();waterCtx.fillRect(0,0,256,256);waterCtx.strokeStyle='#ddffff55';waterCtx.lineWidth=3;for(let row=-1;row<9;row++){waterCtx.beginPath();for(let x=0;x<=256;x+=4){const y=row*36+Math.sin(x*.04+row)*9;if(x===0)waterCtx.moveTo(x,y);else waterCtx.lineTo(x,y);}waterCtx.stroke();}const rippleMap=new T.CanvasTexture(ripples);rippleMap.colorSpace=T.SRGBColorSpace;rippleMap.wrapS=rippleMap.wrapT=T.RepeatWrapping;rippleMap.repeat.set(4,3);p.water.material.map=rippleMap;p.rippleMap=rippleMap;
    p.foam=[];if(p.id==='waves')for(let strip=0;strip<2;strip++){const foamGeometry=new T.BufferGeometry(),positions=new Float32Array(29*2*3),indices=[];for(let j=0;j<28;j++){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}foamGeometry.setAttribute('position',new T.BufferAttribute(positions,3));foamGeometry.setIndex(indices);const foam=add(foamGeometry,new T.MeshBasicMaterial({color:0xe8ffff,transparent:true,opacity:.62,side:T.DoubleSide,depthWrite:false}),p.x,0,p.z);foam.frustumCulled=false;p.foam.push(foam);}

    for(const x of [p.x-p.w/2-.3,p.x+p.w/2+.3])box(.6,.4,p.d+1,cream,x,.12,p.z);
    for(const z of [p.z-p.d/2-.3,p.z+p.d/2+.3])box(p.w+1,.4,.6,cream,p.x,.12,z);
    for(let i=0;i<4;i++)box(.6,.15,2.6,white,p.x-p.w/2+i*.45,.12-i*.12,p.z);
    for(const board of label(p.name,p.x,3.4,p.z-p.d/2-1,13,Math.PI))board.userData.parkAction='pool:'+p.id;
    const gx=p.x+p.w/2+2.5;box(1.5,1.8,1.5,wood,gx,.9,p.z);box(1.8,.18,1.8,white,gx,1.9,p.z);
    const guard=new T.Group();scene.add(guard);p.guard=guard;p.watch=v(gx,2,p.z);guard.position.copy(p.watch);
    box(.7,.8,.42,red,0,1.15,0,guard);sphere(.27,material(0xffc398),0,1.9,0,guard);box(.62,.12,.55,red,0,2.15,0,guard);
    for(const x of [-.22,.22]){box(.18,.7,.2,white,x,.45,0,guard);box(.18,.75,.2,material(0xffc398),x*2,1.1,0,guard);}
    const buoy=add(new T.TorusGeometry(.35,.09,6,20),material(0xff7c37),.6,1,0,guard);buoy.rotation.y=Math.PI/2;
    label('СПАСАТЕЛЬ',gx,5,p.z,4,Math.PI);
    if(p.id==='cold')for(let i=0;i<8;i++){const ice=add(new T.IcosahedronGeometry(.55,0),material(0xdbf8ff),p.x-p.w/2+1+i*(p.w-2)/7,.35,p.z+p.d/2-1);ice.scale.set(1,.35,1);}
  }
  for(let i=0;i<menu.length;i++) {
    const item=menu[i];item.x=48;item.z=56+i*12;item.entry=v(43,0,item.z);
    const shop=new T.Group();scene.add(shop);shop.position.set(item.x,0,item.z);
    box(4,2.8,4,material(item.color),0,1.4,0,shop);box(.2,1.5,3.4,wood,-2.08,1.65,0,shop);box(.4,.16,4,white,-2.25,1.2,0,shop);box(4.8,.3,4.8,material(item.color),0,3,0,shop);
    for(let j=0;j<6;j++)box(.45,.08,4.9,j%2?white:red,-1.1+j*.45,3.2,0,shop);
    const topY=3.8,bun=material(0xf5bb6a),brown=material(0x8e4428),yellow=material(0xffdc57);
    if(item.id==='hotdog'){for(const z of [-.22,.22]){const b=sphere(.55,bun,0,topY,z,shop);b.scale.set(2,.6,.55);}const sausage=sphere(.42,brown,0,topY+.15,0,shop);sausage.scale.set(2.5,.6,.6);box(1.8,.08,.08,yellow,0,topY+.4,0,shop);}
    if(item.id==='burger'){for(const [dy,r,m]of [[0,1,bun],[.25,1.05,brown],[.42,1.08,yellow],[.6,1,bun]])add(new T.CylinderGeometry(r,r,.22,16),m,0,topY+dy,0,shop);}
    if(item.id==='pizza'){const crust=add(new T.CylinderGeometry(1.1,1.1,.18,3),bun,0,topY,0,shop);crust.rotation.y=.5;add(new T.CylinderGeometry(.98,.98,.05,3),yellow,0,topY+.13,0,shop);for(const [x,z]of [[0,0],[.3,.2],[-.3,.2]])add(new T.CylinderGeometry(.14,.14,.05,10),red,x,topY+.18,z,shop);}
    if(item.id==='lemonade'){add(new T.CylinderGeometry(.5,.35,1.2,14),yellow,0,topY+.3,0,shop);box(.08,1.1,.08,red,.15,topY+1,0,shop);const lemon=add(new T.TorusGeometry(.3,.07,6,18),material(0xf9ff8a),.42,topY+.75,0,shop);lemon.rotation.y=Math.PI/2;}
    shop.traverse(o=>o.userData.parkAction='food:'+item.id);
    for(const sign of label(item.name+' · '+item.price,item.x-2.6,2.4,item.z,5,-Math.PI/2))sign.userData.parkAction='food:'+item.id;
  }
  const selfieEntry=v(-33,0,39);const booth=new T.Group();scene.add(booth);booth.position.set(-33,0,43);box(4,.2,4,material(0xc98cff),0,.1,0,booth);box(4,4,.2,material(0x795de2),0,2,1.8,booth);for(const x of [-1.9,1.9])box(.2,4,4,material(0xf8a0dd),x,2,0,booth);box(4.4,.3,4.4,material(0x66d9ef),0,4.1,0,booth);booth.traverse(o=>o.userData.parkAction='selfie');for(const sign of label('SELFIE · 9:16',-33,4.6,41,5,Math.PI))sign.userData.parkAction='selfie';
  const accessory=new T.Group();rig.body.add(accessory);const shirtMesh=rig.body.children[0],baseShirts=shirtMesh.material;
  const skinNames={classic:'Классика',duck:'Утёнок',pineapple:'Ананас',space:'Космонавт',neon:'Неон'};
  function applySkin(id){if(!skinNames[id])return;accessory.traverse(o=>{if(o.geometry)o.geometry.dispose();});accessory.clear();shirtMesh.material=id==='classic'?baseShirts:baseShirts.map(m=>{const clone=m.clone();clone.map=null;clone.color.setHex({duck:0xffdc54,pineapple:0xc0d35a,space:0xecf4ff,neon:0xc65cff}[id]);return clone;});
    if(id==='duck'){const ring=add(new T.TorusGeometry(.8,.22,8,24),material(0xffda39),0,1,0,accessory);ring.rotation.x=Math.PI/2;sphere(.23,material(0xffe346),0,1.16,.85,accessory);box(.25,.1,.2,material(0xff8d43),0,1.14,1.06,accessory);}
    if(id==='pineapple'){const cap=sphere(.6,material(0xe7b842),0,3.65,0,accessory);cap.scale.y=.8;for(let i=0;i<7;i++){const leaf=add(new T.ConeGeometry(.16,.85,4),material(0x52b55f),Math.cos(i)*.18,4.25,Math.sin(i)*.18,accessory);leaf.rotation.z=Math.sin(i)*.6;}}
    if(id==='space'){sphere(.78,new T.MeshStandardMaterial({color:0xa1edff,transparent:true,opacity:.27,roughness:.1,depthWrite:false}),0,3.02,0,accessory);const neck=add(new T.TorusGeometry(.62,.1,8,24),white,0,2.5,0,accessory);neck.rotation.x=Math.PI/2;box(.7,.8,.3,material(0xc7d7e5),0,1.9,-.5,accessory);}
    if(id==='neon'){for(const x of [-.23,.23])box(.36,.2,.1,new T.MeshBasicMaterial({color:0x64ffda}),x,3.06,.48,accessory);box(.9,.1,.1,material(0xff66d6),0,3.22,.45,accessory);}
    data.skin=id;
  }
  applySkin(data.skin);
  const panel=document.createElement('aside');panel.id='park-panel';panel.hidden=true;panel.setAttribute('aria-label','Парк, магазин и рекорды');document.body.append(panel);
  const rewardHUD=document.createElement('div');rewardHUD.id='ride-reward-hud';rewardHUD.hidden=true;document.body.append(rewardHUD);
  const boost=document.createElement('button');boost.id='boost-button';boost.textContent='Разгон · Shift';boost.hidden=true;document.body.append(boost);
  const swimHUD=document.createElement('section');swimHUD.id='swim-hud';swimHUD.hidden=true;
  swimHUD.innerHTML='<strong id="pool-title"></strong><p id="pool-status"></p><meter id="pool-temperature" min="0" max="100" value="100"></meter><div><button id="paddle">Грести · Пробел</button><button id="dive">Нырнуть · V</button><button id="pool-exit">На берег · E</button></div>';document.body.append(swimHUD);
  const toggle=document.createElement('button');toggle.id='park-toggle';document.querySelector('.top-actions').append(toggle);toggle.onclick=()=>{if(state.mode==='ride'){say('Парк и покупки доступны после спуска.');return;}panel.hidden?showHub():panel.hidden=true;};
  let fuel=1,capacity=1,boostPressed=false,paddlePressed=false,pending=null,current=null,elapsed=0,poolDistance=0,poolAwarded=false,diveTime=0,rescue=null,boardTick=0;
  function hold(button,change){button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);change(true);};for(const ev of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(ev,()=>change(false));}
  hold(boost,value=>boostPressed=value);hold($('paddle'),value=>paddlePressed=value);$('dive').onclick=dive;$('pool-exit').onclick=exitPool;
  function refreshWallet(){toggle.textContent='Парк · '+data.wallet+' 🪙';}
  function heading(title){panel.replaceChildren();const close=document.createElement('button');close.textContent='Закрыть ×';close.className='panel-close';close.onclick=()=>{panel.hidden=true;selfieFocus=false;};panel.append(close);const h=document.createElement('h2');h.textContent=title;panel.append(h);}
  function button(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;panel.append(b);return b;}
  function paragraph(text){const p=document.createElement('p');p.textContent=text;panel.append(p);}
  function showHub(){panel.hidden=false;heading('Парк · '+data.wallet+' очков');paragraph('Скорость и чистые спуски приносят очки. Разгон: держи Shift или кнопку.');button('Аквапарк целиком · все входы',showAttractions);button('Селфи-будка и скины',()=>travel(selfieEntry,showSelfie,'Идём в селфи-будку'));button('Большое табло рекордов',()=>showRecords());button('Ларьки с едой',()=>showShop());for(const p of pools)button(p.name,()=>travel(p.entry,()=>enterPool(p),'Идём в '+p.name.toLowerCase()));paragraph('В холодной воде держи Пробел и направление. За ныряющими следит спасатель.');}
  function showAttractions(){panel.hidden=false;heading('Все горки в одном парке');button('Показать весь аквапарк',()=>{parkOverview=true;selfieFocus=false;panel.hidden=true;$('view').textContent='К герою';});paragraph('Общие дорожки соединяют входы. Полный спуск открывается при входе в свою зону.');for(const entry of layout.entries)button(entry.name+(entry.current?' · текущая':''),()=>layout.activate(entry.id));button('Назад в парк',showHub);}
  function showSelfie(){selfieFocus=true;parkOverview=false;state.heading=Math.PI;panel.hidden=false;heading('SELFIE · фото для TikTok');paragraph('Выбери скин, сделай вертикальное фото 9:16 и скачай его.');for(const [id,name] of Object.entries(skinNames))button(name+(data.skin===id?' ✓':''),()=>{applySkin(id);save();showSelfie();});button('Снять фото 9:16',capturePhoto);}
  function capturePhoto(){if(state.mode!=='walk')return;const previousSize=renderer.getSize(new T.Vector2()),previousRatio=renderer.getPixelRatio(),previousAspect=camera.aspect;renderer.setPixelRatio(1);renderer.setSize(1080,1920,false);camera.aspect=9/16;camera.updateProjectionMatrix();camera.position.copy(state.position).add(v(0,1.7,-5));camera.up.set(0,1,0);camera.lookAt(state.position.clone().add(v(0,1.25,0)));renderer.render(scene,camera);const source=renderer.domElement,canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d'),ratio=9/16;const sky=ctx.createLinearGradient(0,0,0,1920);sky.addColorStop(0,'#87cefa');sky.addColorStop(1,'#e7f4ef');ctx.fillStyle=sky;ctx.fillRect(0,0,1080,1920);let sw=source.width,sh=source.height;if(sw/sh>ratio)sw=sh*ratio;else sh=sw/ratio;ctx.drawImage(source,(source.width-sw)/2,(source.height-sh)/2,sw,sh,0,0,1080,1920);renderer.setPixelRatio(previousRatio);renderer.setSize(previousSize.x,previousSize.y,false);camera.aspect=previousAspect;camera.updateProjectionMatrix();ctx.fillStyle='#123f4bcc';ctx.fillRect(0,0,1080,140);ctx.fillRect(0,1750,1080,170);ctx.fillStyle='#fff6d0';ctx.font='bold 65px Arial';ctx.fillText('TRAPKINS · SELFIE',45,95);ctx.font='48px Arial';ctx.fillText(data.name+' · '+skinNames[data.skin],45,1838);lastPhoto=canvas.toDataURL('image/png');showSelfie();const image=document.createElement('img');image.id='selfie-preview';image.alt='Вертикальное селфи из аквапарка';image.src=lastPhoto;panel.append(image);button('Скачать PNG 9:16',()=>{const link=document.createElement('a');link.href=lastPhoto;link.download='trapkins-selfie.png';link.click();});}
  function showRecords(){panel.hidden=false;heading('Рекорды этого браузера');if(state.mode==='walk'&&state.position.distanceTo(v(18,0,46))>5)button('Подойти к большому табло',()=>travel(v(18,0,46),showRecords,'Идём к большому табло'));const name=document.createElement('input');name.id='player-name';name.maxLength=16;name.value=data.name;name.setAttribute('aria-label','Имя игрока');panel.append(name);button('Сохранить имя',()=>{data.name=name.value.trim().slice(0,16)||'Игрок';save();say('Имя сохранено: '+data.name);});
    const table=document.createElement('table'),head=table.createTHead().insertRow();for(const text of ['Игрок / горка','Очки','км/ч']){const th=document.createElement('th');th.textContent=text;head.append(th);}const body=table.createTBody();for(const r of ranked().slice(0,10)){const row=body.insertRow();for(const value of [r.name+' · '+r.course,r.points,Math.round(r.speed)])row.insertCell().textContent=String(value);}panel.append(table);if(!data.records.length)paragraph('Пока нет рекордов. Пройди любую горку!');button('Назад в парк',showHub);}
  function showShop(){panel.hidden=false;heading('Еда за очки · '+data.wallet);paragraph('Покупка даёт энергию для следующего спуска. Оплата — только заработанными очками.');for(const item of menu)button(item.name+' · '+item.price+' очков',()=>buy(item.id));paragraph('Запас энергии: '+data.energy+'/3');button('Назад в парк',showHub);}
  function travel(point,done,message){if(!['walk','menu'].includes(state.mode)){say('Сначала заверши спуск или выйди из бассейна.');return;}if(state.mode==='menu')return;panel.hidden=true;selfieFocus=false;parkOverview=false;pending={point:point.clone(),done};navigate(point);say(message);}
  function purchase(item){if(data.wallet<item.price){say('Не хватает очков. Прокатись с горки!');return false;}data.wallet-=item.price;data.inventory[item.id]=(data.inventory[item.id]||0)+1;data.energy=Math.min(3,data.energy+1);save();say(item.name+' куплен! Энергия для следующего спуска.');showShop();return true;}
  function buy(id){const item=menu.find(x=>x.id===id);if(!item)return false;if(!['walk'].includes(state.mode)){say('Покупки доступны на площадке.');return false;}if(data.wallet<item.price){say('Не хватает очков. Прокатись с горки!');return false;}if(state.position.distanceTo(item.entry)>5){travel(item.entry,()=>purchase(item),'Идём к ларьку: '+item.name);return false;}return purchase(item);}
  function enterPool(p){pending=null;current=p;poolDistance=0;poolAwarded=false;diveTime=0;state.temperature=100;state.pool=p.id;state.heading=0;state.position.set(p.x-p.w/2+1.5,-.6,p.z);setMode('swim');panel.hidden=true;$('instruction').textContent=p.id==='cold'?'Холодно! Держи Пробел и направление, чтобы согреться.':'Плыви среди волн. Ныряющих возвращает спасатель.';say(p.id==='cold'?'ХОЛОДНО! Быстро греби, чтобы согреться!':'Волны идут! Стрелки / WASD — плыть.');}
  function exitPool(){if(!current||state.mode==='rescue')return;state.position.copy(current.entry);current=null;diveTime=0;state.pool=null;setMode('walk');swimHUD.hidden=true;say('Ты на берегу.');}
  function dive(){if(state.mode!=='swim'||!current)return;diveTime=1;say('Спасатель заметил нырок!');}
  function startRescue(reason){if(rescue||!current)return;rescue={time:0,from:state.position.clone(),guard:current.guard.position.clone(),reason};setMode('rescue');say(reason==='cold'?'Спасатель помогает согреться!':'Нырять нельзя! Спасатель возвращает тебя на берег.');}
  function waveHeight(p,x,z){const edge=T.MathUtils.clamp(Math.min((p.w/2-Math.abs(x-p.x))/2,(p.d/2-Math.abs(z-p.z))/2),0,1);return p.id==='waves'?(Math.sin((z-p.z)*.46-elapsed*1.8)*.5+Math.sin((x-p.x)*.32-elapsed)*.13)*edge:Math.sin(elapsed*1.2+x*.4)*.035;}
  function swim(dt){if(!current)return;if(state.mode==='rescue'){rescue.time+=dt;const t=rescue.time;if(t<1.2)current.guard.position.lerpVectors(rescue.guard,rescue.from.clone().add(v(.8,.5,0)),T.MathUtils.smoothstep(t,0,1.2));else{const a=T.MathUtils.smoothstep(t,1.2,3.6);state.position.lerpVectors(rescue.from,current.entry,a);current.guard.position.copy(state.position).add(v(.8,.2,0));}if(t>=3.6){const p=current;p.guard.position.copy(p.watch);rescue=null;state.temperature=100;state.position.copy(p.entry);state.pool=null;current=null;setMode('walk');say('Спасатель вернул тебя на берег.');}return;}
    const x=Number(held.has('d')||held.has('ArrowRight'))-Number(held.has('a')||held.has('ArrowLeft')),z=Number(held.has('w')||held.has('ArrowUp'))-Number(held.has('s')||held.has('ArrowDown')),fast=paddlePressed||held.has(' ')||held.has('Shift'),forward=camera.getWorldDirection(new T.Vector3()).setY(0).normalize(),right=new T.Vector3().crossVectors(forward,v(0,1,0)).normalize(),direction=right.multiplyScalar(x).addScaledVector(forward,z);
    if(!direction.lengthSq()&&fast)direction.set(Math.sin(state.heading),0,Math.cos(state.heading));if(direction.lengthSq())direction.normalize();const speed=fast?5.2:current.id==='cold'?2.1:3.2,previous=state.position.clone();state.position.addScaledVector(direction,speed*dt);state.position.x=T.MathUtils.clamp(state.position.x,current.x-current.w/2+1,current.x+current.w/2-1);state.position.z=T.MathUtils.clamp(state.position.z,current.z-current.d/2+1,current.z+current.d/2-1);const moved=Math.hypot(state.position.x-previous.x,state.position.z-previous.z);poolDistance+=moved;if(direction.lengthSq())state.heading=Math.atan2(direction.x,direction.z);state.walked+=moved;
    if(current.id==='cold'){state.temperature=T.MathUtils.clamp(state.temperature+(moved/dt>2.5?5:-8)*dt,0,100);if(state.temperature===0)startRescue('cold');}
    state.position.y=-.65+waveHeight(current,state.position.x,state.position.z);if(diveTime>0){diveTime-=dt;state.position.y-=.9;if(diveTime<.65)startRescue('dive');}
    if(!poolAwarded&&poolDistance>35){poolAwarded=true;const points=current.id==='cold'?100:60;data.wallet+=points;save();say('Заплыв пройден! +'+points+' очков');}
  }
  function beginRun(){pending=null;selfieFocus=false;parkOverview=false;waitingAnnounced=false;capacity=data.energy>0?1.4:1;fuel=capacity;if(data.energy>0){data.energy--;save();}state.speedPoints=0;state.runMaxSpeed=0;state.freeBoost=0;state.runBanked=false;}
  function acceleration(dt){state.freeBoost=Math.max(0,(state.freeBoost||0)-dt);const pressed=boostPressed||held.has('Shift')||held.has(' '),active=state.freeBoost>0||(pressed&&fuel>.01);if(active&&state.freeBoost<=0)fuel=Math.max(0,fuel-dt*.25);else if(!active&&!pressed)fuel=Math.min(capacity,fuel+dt*.11);boost.textContent=(active?'РАЗГОН! ':'Разгон · Shift ')+Math.round(fuel*100)+'%';boost.setAttribute('aria-pressed',String(active));return active?1.23:1;}
  function finishRun(){guards.release(courseId);if(state.runBanked)return;state.runBanked=true;const speedBonus=Math.floor(state.speedPoints||0),points=state.score+speedBonus+100;data.wallet+=points;state.awardedPoints=points;state.score=points;data.records.push({name:data.name,course:courseName,courseId,points,time:state.rideTime,speed:(state.runMaxSpeed||state.speed)*3.6});data.records=ranked().slice(0,30);save();say('Спуск: +'+points+' очков · бонус скорости +'+speedBonus);}
  function interact(){if(state.mode==='swim'){exitPool();return true;}if(state.mode!=='walk')return false;if(state.position.distanceTo(selfieEntry)<4){showSelfie();return true;}for(const entry of layout.entries)if(!entry.current&&state.position.distanceTo(entry.point)<4){layout.activate(entry.id);return true;}for(const item of menu)if(state.position.distanceTo(item.entry)<5){showShop();return true;}for(const p of pools)if(state.position.distanceTo(p.entry)<4){enterPool(p);return true;}if(state.position.distanceTo(v(18,0,46))<9){showRecords();return true;}return false;}
  function activate(action){if(action==='selfie')return travel(selfieEntry,showSelfie,'Идём в селфи-будку');if(action.startsWith('route:'))return layout.activate(action.slice(6));if(action==='records')return showRecords();if(action.startsWith('food:'))return showShop();if(action.startsWith('pool:')){const p=pools.find(p=>p.id===action.slice(5));if(p)travel(p.entry,()=>enterPool(p),'Идём в '+p.name.toLowerCase());}}
  function isBlocked(p){if(layout.bounds.some(b=>p.x>b.x&&p.x<b.x+b.w&&p.z>b.z&&p.z<b.z+b.d))return true;if(Math.abs(p.x+33)<2.2&&p.z>41&&p.z<45.2)return true;if(pools.some(pool=>Math.abs(p.x-pool.x)<pool.w/2+.8&&Math.abs(p.z-pool.z)<pool.d/2+.8))return true;return menu.some(item=>Math.abs(p.x-item.x)<2.7&&Math.abs(p.z-item.z)<2.7)||Math.abs(p.x-18)<8&&Math.abs(p.z-49)<1;}
  function update(dt){document.body.classList.toggle('park-overview',parkOverview);elapsed+=dt;guards.update(dt);if(waitingRoute&&guards.request(waitingRoute.id)){const url=new URL(location.href);url.searchParams.set('course',waitingRoute.id);url.searchParams.set('play','1');url.searchParams.set('entry','1');url.searchParams.set('v','32');waitingRoute=null;location.assign(url.href);}boardTick+=dt;boost.hidden=state.mode!=='ride';rewardHUD.hidden=state.mode!=='ride';if(state.mode==='ride')rewardHUD.textContent=Math.round(state.speed*3.6)+' км/ч · бонус +'+Math.floor(state.speedPoints||0);if(pending&&state.mode==='walk'&&state.position.distanceTo(pending.point)<.65){const done=pending.done;pending=null;stopNavigation();done();}
    for(const p of pools){p.rippleMap.offset.set(Math.sin(elapsed*.3)*.06,-elapsed*.05);for(let strip=0;strip<p.foam.length;strip++){const foam=p.foam[strip],period=Math.PI*4/.46,z=(elapsed*1.8+Math.PI/2+strip*Math.PI*2)/.46%period-period/2;foam.visible=Math.abs(z)<p.d/2-.5;if(foam.visible){const attr=foam.geometry.attributes.position;for(let j=0;j<=28;j++)for(let side=0;side<2;side++){const x=-p.w/2+1+j*(p.w-2)/28,zz=z+(side? .11:-.11);attr.setXYZ(j*2+side,x,.29+waveHeight(p,x+p.x,zz+p.z),zz);}attr.needsUpdate=true;}}
    const a=p.water.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,waveHeight(p,a.getX(i)+p.x,a.getZ(i)+p.z));a.needsUpdate=true;if(boardTick>.15)p.water.geometry.computeVertexNormals();}
    if(boardTick>.15)boardTick=0;swimHUD.hidden=!['swim','rescue'].includes(state.mode);if(current){$('pool-title').textContent=current.name;$('pool-temperature').hidden=current.id!=='cold';$('pool-temperature').value=state.temperature||0;$('pool-status').textContent=state.mode==='rescue'?'Спасатель возвращает тебя на берег':current.id==='cold'?'Тепло: '+Math.round(state.temperature)+'% · Пробел + направление — быстро плыть':'Пройдено '+Math.floor(poolDistance)+' м · нырнёшь — спасатель поймает';for(const id of ['paddle','dive','pool-exit'])$(id).disabled=state.mode==='rescue';}
  }
  refreshBoard();refreshWallet();
  return {leaveOverview(){parkOverview=false;},zoom(delta){mapZoom=T.MathUtils.clamp(mapZoom+delta*.0005,.45,1.3);},get overviewScale(){return mapZoom;},get overview(){return parkOverview;},get selfieFocus(){return selfieFocus;},allowLaunch(){const allowed=guards.request(courseId);if(!allowed&&!waitingAnnounced){waitingAnnounced=true;say('Спасатель пропускает по одному. Подожди очередь.');}return allowed;},update,swim,interact,activate,isBlocked,beginRun,acceleration,finishRun,dive,exitPool,showHub,showRecords,showShop,buy,refuel:amount=>{fuel=Math.min(1.4,fuel+amount);},get snapshot(){return {guards:guards.snapshot,skin:data.skin,selfieReady:!!lastPhoto,attractions:layout.entries.map(e=>({id:e.id,entry:e.point.toArray()})),wallet:data.wallet,records:ranked(),inventory:{...data.inventory},energy:data.energy,fuel,currentPool:current?.id||null,temperature:state.temperature,rescuing:!!rescue,poolDistance,waves:pools[0].water.geometry.attributes.position.getY(Math.floor(pools[0].water.geometry.attributes.position.count/2)),boardVersion:boardTexture.version};}};
};
