/* Connected promenade and full-size attraction entrances for the park overview. */
window.createParkLayout=function({T,scene,extra,track,courseId,guards,onEnter}){
 const v=(x,y,z)=>new T.Vector3(x,y,z),mat=color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.45});
 const basic=new T.MeshStandardMaterial({color:0xffe8b8,roughness:.8});
 const add=(g,m,p)=>{const o=new T.Mesh(g,m);o.position.copy(p);scene.add(o);return o;};
 const curve=points=>new T.CatmullRomCurve3(points.map(p=>v(...p)));
 const spiral=[];for(let i=0;i<=100;i++){const t=i/100,a=Math.PI+t*Math.PI*5;spiral.push([10*Math.cos(a),14-12*t,10*Math.sin(a)]);}spiral.push([10,.9,10],[10,.55,24]);
 const tunnel=curve([[-10,14,0],[-14,13,-16],[-9,12,-33],[9,11,-43],[30,10,-38],[43,9,-19],[39,8,4],[25,7,17],[7,6,14],[-10,5,10],[-23,4,21],[-23,3,37],[-8,2.5,43],[8,2,39],[21,1.5,31],[10,.55,24]]);
 const loop=[[-10,14,0],[-12,7,-25],[-12,3,-45]];for(let i=1;i<=100;i++){const q=i/100,a=q*Math.PI*2;loop.push([-12+6*q,13-10*Math.cos(a),-45-10*Math.sin(a)]);}loop.push([5,2,-60],[30,1.5,-20],[10,.55,24]);
 const flush=[[-10,14,0],[-10,13,15],[20,12,35],[40,11,15],[15,10,-10]];for(let i=0;i<=120;i++){const q=i/120,a=-Math.PI/2+q*Math.PI*6,r=11-8.5*q;flush.push([12+Math.cos(a)*r,5.5+(r-2.5)*.65,22+Math.sin(a)*r]);}flush.push([12,5,22],[12,.55,22]);
 const entries=[
 {id:'spiral',name:'Спираль',color:0xffbf64,paths:[curve(spiral)],closed:false},
 {id:'tunnel',name:'Тоннель',color:0x6999ed,paths:[tunnel],closed:true},
 {id:'kamikaze',name:'Камикадзе',color:0xff7047,paths:[curve(loop)],closed:true},
 {id:'flush',name:'Суперсмыв',color:0xbd92e9,paths:[curve(flush)],closed:false},
 {id:'blackhole',name:'Чёрная дыра',color:0x363956,paths:[extra.blackhole],closed:true},
 {id:'boomerang',name:'Бумеранг',color:0x44d2ad,paths:extra.boom.geometry,closed:false},
 {id:'race',name:'Гонка',color:0x43c8ef,paths:[extra.race,...extra.raceLanes],closed:false}
 ];
 const scale=1;
 for(let i=0;i<entries.length;i++){
   const entry=entries[i],x=i===6?225:100+(i%3)*125,z=i===6?410:55+Math.floor(i/3)*125;
   entry.center=v(x,0,z);if(entry.id===courseId){entry.point=v(-20,0,.8);entry.current=true;continue;}const bounds=new T.Box3();for(const path of entry.paths)for(let j=0;j<=200;j++)bounds.expandByPoint(path.getPointAt(j/200).multiplyScalar(scale).add(v(x,0,z)));entry.point=v(bounds.min.x-7,0,bounds.max.z+9);entry.bounds={x:bounds.min.x-3,z:bounds.min.z-3,w:bounds.max.x-bounds.min.x+6,d:bounds.max.z-bounds.min.z+6};
   add(new T.BoxGeometry(entry.bounds.w+12,.18,entry.bounds.d+18),basic,v((bounds.min.x+bounds.max.x)/2,-.06,(bounds.min.z+bounds.max.z)/2));
   for(let k=0;k<entry.paths.length;k++){
     const path=entry.paths[k],segments=Math.ceil(path.getLength()),positions=[],indices=[],sides=entry.closed?18:12,r=entry.id==='boomerang'?2.8:entry.id==='race'?1.65:2.2;
     const transported=path.computeFrenetFrames(segments,false);
     for(let j=0;j<=segments;j++){const t=j/segments,p=path.getPointAt(t),f=path.getTangentAt(t),right=entry.id==='kamikaze'?transported.normals[j]:new T.Vector3().crossVectors(f,v(0,1,0)).normalize(),up=entry.id==='kamikaze'?new T.Vector3().crossVectors(right,f).normalize():v(0,1,0);for(let a=0;a<=sides;a++){const angle=(a/sides-.5)*Math.PI*(entry.closed?2:1.05),point=p.clone().addScaledVector(right,Math.sin(angle)*r).addScaledVector(up,r*(1-Math.cos(angle)));point.multiplyScalar(scale).add(v(x,0,z));positions.push(...point.toArray());if(j<segments&&a<sides){const n=j*(sides+1)+a;indices.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}}
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const colors=[entry.color,0xff6eaf,0xffdf62,0x8bdf56];const slide=add(g,mat(colors[k]||entry.color),v(0,0,0));slide.userData.parkAction='route:'+entry.id;
   }
   const textureCanvas=document.createElement('canvas');textureCanvas.width=768;textureCanvas.height=192;const ctx=textureCanvas.getContext('2d');ctx.fillStyle='#123e4a';ctx.fillRect(0,0,768,192);ctx.fillStyle='#fff5cc';ctx.font='bold 70px Arial';ctx.textAlign='center';ctx.fillText(entry.name,384,84);ctx.font='36px Arial';ctx.fillText(entry.id===courseId?'ТЕКУЩАЯ ГОРКА':'ВХОД · нажми, чтобы подойти',384,151);const texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;const sign=add(new T.PlaneGeometry(16,4),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}),entry.point.clone().add(v(0,4,0)));sign.userData.parkAction='route:'+entry.id;
   if(entry.id!==courseId)guards.register(entry.id,entry.name,entry.point.clone().add(v(2,0,0)));
 }
 add(new T.BoxGeometry(410,.12,16),basic,v(220,-.03,100));add(new T.BoxGeometry(410,.12,16),basic,v(220,-.03,230));for(const x of [65,190,315,440])add(new T.BoxGeometry(12,.12,440),basic,v(x,-.03,230));
 return{entries,activate(id){const e=entries.find(e=>e.id===id);if(e)onEnter(e);},get bounds(){return entries.filter(e=>e.bounds).map(e=>e.bounds);}};
};
