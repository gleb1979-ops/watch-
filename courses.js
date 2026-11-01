/* Additional routes share the original character, controls and pool workflow. */
window.createExtraCourses=function(T){
 const v=(...p)=>new T.Vector3(...p),curve=points=>{const c=new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?v(...p):p));c.arcLengthDivisions=2400;return c;};
 const blackPoints=[[-10,14,0],[-14,13.8,-9]];
 for(let i=0;i<=180;i++){const q=i/180,a=Math.PI+q*Math.PI*5,r=12-4*q;blackPoints.push([4+Math.cos(a)*r,13.2-10.8*q,-22+Math.sin(a)*r]);}
 blackPoints.push([14,1.8,-12],[16,1.2,4],[10,.55,24]);
 const drop=curve([[-10,14,0],[-10,12,-7],[-6,7,-15],[1,2.5,-23],[5,2,-29]]),ramp=curve([[5,2,-29],[7,2.8,-35],[9,6,-42],[10,11,-48],[10,12.2,-49]]),runout=curve([[5,2,-29],[12,1.8,-24],[23,1.5,-14],[24,1.2,0],[17,.85,13],[10,.55,24]]);
 class Reverse extends T.Curve{getPoint(t,target=new T.Vector3()){return target.copy(ramp.getPointAt(1-t));}getLength(){return ramp.getLength();}}
 const boomerang=new T.CurvePath();boomerang.add(drop);boomerang.add(ramp);boomerang.add(new Reverse());boomerang.add(runout);boomerang.arcLengthDivisions=4000;
 const boomLength=boomerang.getLength(),turn=(drop.getLength()+ramp.getLength())/boomLength,backEnd=(drop.getLength()+2*ramp.getLength())/boomLength;
 const racePoints=[[-10,14,0],[-14,13,-30],[-8,12,-65],[-14,11,-100],[-8,10,-135],[10,9,-160],[40,8,-165],[66,7,-145],[70,6,-112],[60,5,-80],[66,4,-46],[50,3,-16],[30,2,3],[10,.55,24]],race=curve(racePoints);
 const raceLanes=[5.5,11,16.5].map(offset=>curve(Array.from({length:241},(_,i)=>{const u=i/240,p=race.getPointAt(u),f=race.getTangentAt(u),right=new T.Vector3().crossVectors(f,v(0,1,0)).normalize().negate(),blend=T.MathUtils.smoothstep(u,.9,1);right.lerp(v(1,0,0),blend).normalize();return p.addScaledVector(right,offset);})));
 return{blackhole:curve(blackPoints),boomerang,boom:{turn,backEnd,dropEnd:drop.getLength()/boomLength,geometry:[drop,ramp,runout]},race,raceLanes};
};
