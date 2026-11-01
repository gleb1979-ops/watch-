/* A moving sheet follows the bowl surface and drains into a falling water curtain. */
window.createFlushWater=function({T,scene,map}){
 const waterMap=map.clone();waterMap.needsUpdate=true;waterMap.repeat.set(8,3);
 const material=new T.MeshStandardMaterial({map:waterMap,color:0x65e8f2,emissive:0x08758c,emissiveIntensity:.28,roughness:.15,side:T.DoubleSide,transparent:true,opacity:.88,depthWrite:false});
 const positions=[],uv=[],indices=[],N=128,M=28;
 for(let j=0;j<=M;j++){const r=2.5+9*j/M;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2;positions.push(12+Math.cos(a)*r,5.575+(r-2.5)*.65,22+Math.sin(a)*r);uv.push(i/N,j/M);if(j<M&&i<N){const k=j*(N+1)+i;indices.push(k,k+N+1,k+1,k+1,k+N+1,k+N+2);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 function add(geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.userData.dynamic=true;scene.add(m);return m;}
 const sheet=add(g,material);sheet.renderOrder=3;
 const fallMap=map.clone();fallMap.needsUpdate=true;fallMap.repeat.set(5,2);
 const fallMaterial=material.clone();fallMaterial.map=fallMap;fallMaterial.opacity=.7;
 const curtain=add(new T.CylinderGeometry(2.36,2.05,5.3,72,12,true),fallMaterial,12,2.9,22);
 const core=add(new T.CylinderGeometry(.9,1.5,5.3,36,8,true),new T.MeshBasicMaterial({color:0xaff8ff,transparent:true,opacity:.14,side:T.DoubleSide,depthWrite:false}),12,2.9,22);
 const foam=[];for(let strip=0;strip<3;strip++){const fg=new T.BufferGeometry(),fp=new Float32Array(97*2*3),fi=[];for(let j=0;j<96;j++){const k=j*2;fi.push(k,k+1,k+2,k+1,k+3,k+2);}fg.setAttribute('position',new T.BufferAttribute(fp,3));fg.setIndex(fi);const fm=add(fg,new T.MeshBasicMaterial({color:0xe5ffff,transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false}));fm.frustumCulled=false;foam.push(fm);}
 const drops=[],dropGeometry=new T.SphereGeometry(.065,5,5),dropMaterial=new T.MeshBasicMaterial({color:0xd5ffff,transparent:true,opacity:.8});
 for(let i=0;i<72;i++){const d=add(dropGeometry,dropMaterial);d.scale.set(1,3+i%3,1);drops.push(d);}
 function update(t){waterMap.offset.set(-t*.19,t*.25);fallMap.offset.y=t*1.8;core.rotation.y=t*.8;for(let strip=0;strip<foam.length;strip++){const a=foam[strip].geometry.attributes.position;for(let j=0;j<=96;j++){const q=j/96,r=11.35-8.75*q,angle=t*.95+q*Math.PI*3+strip*Math.PI*2/3;for(let side=0;side<2;side++){const rr=r+(side? .045:-.045);a.setXYZ(j*2+side,12+Math.cos(angle)*rr,5.61+(rr-2.5)*.65,22+Math.sin(angle)*rr);}}a.needsUpdate=true;}for(let i=0;i<drops.length;i++){const q=(t*.7+i/drops.length)%1,a=i*2.399+t*1.2,r=.8+(i%9)*.17;drops[i].position.set(12+Math.cos(a)*r,5.5-q*5.5,22+Math.sin(a)*r);}}
 return{update,get snapshot(){return{bowlVertices:g.attributes.position.count,angularOffset:waterMap.offset.x,drainOffset:fallMap.offset.y,drops:drops.length,openDrain:true};}};
};
