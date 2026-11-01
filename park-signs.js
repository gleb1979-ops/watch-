/* Text billboards stay upright and face the viewer, including from behind. */
window.createReadableSign=function(T,scene,texture,width,height,position,action){
 const sign=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true,depthWrite:false,rotation:0}));
 sign.position.copy(position);sign.scale.set(width,height,1);sign.userData.readableSign=true;
 if(action)sign.userData.parkAction=action;scene.add(sign);return sign;
};
