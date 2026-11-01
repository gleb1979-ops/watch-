/* Additional routes share the original character, controls and pool workflow. */
window.createExtraCourses=function(T){
 const v=(...p)=>new T.Vector3(...p),curve=points=>{const c=new T.CatmullRomCurve3(points.map(p=>Array.isArray(p)?v(...p):p));c.arcLengthDivisions=2400;return c;};
 const blackPoints=[[-10,14,0],[-12,13.2,-12],[-5,12.5,-28],[12,11.8,-37],[30,10.7,-30],[33,9.8,-10],[20,8.8,4],[0,7.8,1],[-12,6.8,14],[-4,5.9,29],[13,5.1,32],[28,4.2,21],[25,3.3,7],[15,2.4,8],[10,1.3,17],[10,.55,24]];
 const drop=curve([[-10,14,0],[-10,13,-4],[-8,7,-9],[-2,2.2,-16],[5,1.6,-23]]),ramp=curve([[5,1.6,-23],[7,2,-29],[9,5,-34],[10,11,-38],[10,18,-40],[10,21,-40.5]]),runout=curve([[5,1.6,-23],[13,1.5,-25],[25,1.3,-17],[25,1.1,-3],[17,.8,13],[10,.55,24]]);
 class RampLeg extends T.Curve{constructor(end,reverse=false){super();this.end=end;this.reverse=reverse;this.arcLengthDivisions=1600;}getPoint(t,target=new T.Vector3()){return target.copy(ramp.getPointAt((this.reverse?1-t:t)*this.end));}getLength(){return ramp.getLength()*this.end;}}
 const second=new RampLeg(.72),back=new RampLeg(1,true),secondBack=new RampLeg(.72,true),boomerang=new T.CurvePath();for(const part of [drop,ramp,back,second,secondBack,runout])boomerang.add(part);boomerang.arcLengthDivisions=6000;
 const boomLength=boomerang.getLength(),legs=[];let distance=drop.getLength();for(const [path,direction,top] of [[ramp,'up',21],[back,'back',21],[second,'up',ramp.getPointAt(.72).y],[secondBack,'back',ramp.getPointAt(.72).y]]){const begin=distance/boomLength;distance+=path.getLength();legs.push({begin,end:distance/boomLength,direction,top});}
 const turn=legs[0].end,backEnd=legs[3].end,stageAt=t=>legs.find(leg=>t>=leg.begin&&t<leg.end)||{direction:'down',top:0};
 const racePoints=[[-10,14,0],[-14,13,-30],[-8,12,-65],[-14,11,-100],[-8,10,-135],[10,9,-160],[40,8,-165],[66,7,-145],[70,6,-112],[60,5,-80],[66,4,-46],[50,3,-16],[30,2,3],[10,.55,24]],race=curve(racePoints);
 const raceLanes=[5.5,11,16.5].map(offset=>curve(Array.from({length:241},(_,i)=>{const u=i/240,p=race.getPointAt(u),f=race.getTangentAt(u),right=new T.Vector3().crossVectors(f,v(0,1,0)).normalize().negate(),blend=T.MathUtils.smoothstep(u,.9,1);right.lerp(v(1,0,0),blend).normalize();return p.addScaledVector(right,offset);})));
 return{blackhole:curve(blackPoints),boomerang,boom:{turn,backEnd,legs,stageAt,dropEnd:drop.getLength()/boomLength,geometry:[drop,ramp,runout]},race,raceLanes};
};
