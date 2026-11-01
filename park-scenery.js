/* Varied planting and benches, batched by material to keep the park responsive. */
window.createParkScenery=function({T,scene}){
 const meshes=[],obstacles=[],materials=new Map(),v=(x,y,z)=>new T.Vector3(x,y,z);let palms=0,trees=0,benches=0;
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c)};
 function add(g,c,x,y,z){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);meshes.push(m);return m;}
 function box(w,h,d,c,x,y,z){return add(new T.BoxGeometry(w,h,d),c,x,y,z)}
 const locations=[];for(let i=0;i<11;i++)locations.push([-39,46+i*8],[61,43+i*9]);for(let i=0;i<9;i++)locations.push([-29+i*10,139]);for(const [i,[x,z]]of locations.entries()){
  const height=3.7+(i%4)*.65,palm=i%3!==0;obstacles.push({x,z,r:.65});add(new T.CylinderGeometry(.16,.3,height,7),0x9b754b,x,height/2,z);
  if(palm){palms++;for(let j=0;j<7;j++){const a=j*Math.PI*2/7,leaf=add(new T.SphereGeometry(1,7,4),[0x4f9c58,0x7ab65f,0x6baf83][i%3],x+Math.cos(a)*1.1,height+.15,z+Math.sin(a)*1.1);leaf.scale.set(2,.22,.65);leaf.rotation.y=-a;leaf.rotation.z=Math.sin(a)*.17;}for(let j=0;j<3;j++)add(new T.SphereGeometry(.22,6,5),0x91713d,x+Math.cos(j*2)*.3,height-.3,z+Math.sin(j*2)*.3);}
  else{trees++;for(let j=0;j<3;j++){const crown=add(new T.IcosahedronGeometry(1.35,1),[0x5c9b57,0x86ad50,0xe6a8b9][Math.floor(i/3)%3],x+(j-1)*.65,height-.1+j*.3,z+Math.sin(j*3)*.5);crown.scale.y=1.15;}}
 }
 const seats=[[-19,43],[4,47],[32,43],[-34,84],[0,88],[29,125],[56,100],[56,76],[12,133],[-12,131]];
 for(const [x,z]of seats){benches++;obstacles.push({x,z,w:3.2,d:1.1});for(let j=0;j<4;j++)box(3,.1,.2,0xb47d4c,x,.65,z-.32+j*.22);for(let j=0;j<3;j++)box(3,.16,.1,0xb47d4c,x,.95+j*.2,z+.45);for(const dx of [-1.15,1.15]){box(.15,.65,.9,0x49636c,x+dx,.325,z);box(.12,1,.12,0x49636c,x+dx,1,z+.45);}}
 const buckets=new Map();for(const m of meshes){m.updateMatrixWorld(true);const g=m.geometry.toNonIndexed();g.applyMatrix4(m.matrixWorld);if(!buckets.has(m.material))buckets.set(m.material,[]);buckets.get(m.material).push(g);m.geometry.dispose();}
 for(const [material,gs]of buckets){const g=new T.BufferGeometry();for(const name of ['position','normal']){const arr=new Float32Array(gs.reduce((n,a)=>n+a.attributes[name].array.length,0));let off=0;for(const a of gs){arr.set(a.attributes[name].array,off);off+=a.attributes[name].array.length;}g.setAttribute(name,new T.BufferAttribute(arr,3));}g.computeBoundingSphere();const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;scene.add(m);for(const a of gs)a.dispose();}
 return{isBlocked(p){return Math.abs(p.y)<1&&obstacles.some(o=>o.r?Math.hypot(p.x-o.x,p.z-o.z)<o.r:Math.abs(p.x-o.x)<o.w/2+.2&&Math.abs(p.z-o.z)<o.d/2+.2)},get snapshot(){return{palms,trees,benches,batches:buckets.size}}};
};
