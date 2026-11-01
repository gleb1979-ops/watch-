/* Autonomous guests walk the shared paths, stop at shops and watch the scoreboard. */
window.createParkVisitors=function({T,scene,blocked,getView}){
 const v=(x,z)=>new T.Vector3(x,0,z),colors=[0xef7c58,0x8ece69,0x65c8dd,0xd38ae2,0xffc859],bots=[];
 const skin=new T.MeshStandardMaterial({color:0xffc49b}),dark=new T.MeshStandardMaterial({color:0x294a66});
 function part(g,m,x,y,z,parent){const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 const central=[v(-30,35),v(0,40),v(18,46),v(40,40),v(43,56),v(43,70),v(43,94),v(45,123),v(6,123),v(7,103),v(4,82),v(-28,82),v(-29,66)];
 const campus=[v(65,112),v(440,112),v(440,230),v(65,230),v(65,455),v(440,455),v(440,230),v(65,230)];
 for(let i=0;i<48;i++){
  const root=new T.Group(),shirt=new T.MeshStandardMaterial({color:colors[i%colors.length]});scene.add(root);root.scale.setScalar(.8+(i%3)*.06);
  const torso=part(new T.BoxGeometry(.55,.7,.32),shirt,0,1.12,0,root),head=part(new T.SphereGeometry(.24,10,8),skin,0,1.77,0,root);part(new T.BoxGeometry(.48,.12,.43),dark,0,1.94,0,root);
  const legs=[],arms=[];for(const x of [-.17,.17]){const leg=new T.Group();leg.position.set(x,.8,0);root.add(leg);part(new T.BoxGeometry(.16,.72,.19),dark,0,-.36,0,leg);legs.push(leg);const arm=new T.Group();arm.position.set(x*2,1.38,0);root.add(arm);part(new T.BoxGeometry(.14,.6,.16),skin,0,-.25,0,arm);arms.push(arm);}
  for(const x of [-.085,.085])part(new T.SphereGeometry(.035,6,6),dark,x,1.8,.215,root);
  const path=i<22?central:campus,index=i%path.length;root.position.lerpVectors(path[index],path[(index+1)%path.length],Math.floor(i/path.length)*.15);bots.push({id:i,root,head,legs,arms,path,index:(index+1)%path.length,speed:1.2+(i%4)*.23,wait:(i%4)*.4,walked:0,activity:'walking'});
 }
 let clock=0;
 function update(dt,player){clock+=dt;const view=getView?.();for(const bot of bots){bot.root.visible=!view||view.overview||bot.root.position.distanceTo(view.position)<260;if(bot.wait>0){bot.wait-=dt;bot.activity=bot.path===central&&[3,5,6,7].includes(bot.index)?'visiting':'resting';bot.head.rotation.y=Math.sin(clock*1.3+bot.id)*.25;bot.arms[0].rotation.x=Math.sin(clock*3)*.15;continue;}const target=bot.path[bot.index],delta=target.clone().sub(bot.root.position),distance=delta.length();if(distance<.22){bot.wait=bot.path===central?1.5+(bot.id%3):.5;bot.index=(bot.index+1)%bot.path.length;continue;}delta.normalize();const next=bot.root.position.clone().addScaledVector(delta,Math.min(distance,bot.speed*dt));const crowded=next.distanceTo(player)<1||bots.some(other=>other.id<bot.id&&other.root.position.distanceTo(next)<.7);if(crowded){bot.activity='waiting';continue;}if(blocked(next)){bot.index=(bot.index+1)%bot.path.length;bot.activity='rerouting';continue;}bot.root.position.copy(next);bot.root.rotation.y=Math.atan2(delta.x,delta.z);bot.walked+=bot.speed*dt;bot.activity='walking';for(let i=0;i<2;i++){const swing=Math.sin(bot.walked*5+i*Math.PI)*.45;bot.legs[i].rotation.x=swing;bot.arms[i].rotation.x=-swing;}}}
 return{update,get snapshot(){return bots.map(b=>({id:b.id,position:b.root.position.toArray(),activity:b.activity,walked:b.walked}));}};
};
