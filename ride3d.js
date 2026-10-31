/* Local 3D ride renderer. Three.js is vendored; artwork stays on this site. */
(function () {
  'use strict';
  const T = window.THREE;
  if (!T) return;
  const UP = new T.Vector3(0, 1, 0), LENGTH = 480;
  const point = (type, u) => {
    const d = u * LENGTH;
    if (type === 2) { const a = d / 38; return new T.Vector3(38 * (1 - Math.cos(a)), 100 - d * .145, 38 * Math.sin(a)); }
    if (type === 5) return new T.Vector3(0, 20 + 65 * Math.pow(u * 2 - 1, 2), (u - .5) * 160);
    const x = type === 3 ? 27 * Math.sin(d / 53) + 6 * Math.sin(d / 22) : type === 6 ? 38 * Math.sin(d / 64) : [1,4].includes(type) ? 3 * Math.sin(d / 95) : 19 * Math.sin(d / 49);
    return new T.Vector3(x, 100 - d * ([1,4].includes(type) ? .22 : .14) + (type === 1 ? Math.cos(d / 28) * 4 : Math.sin(d / 40) * 1.5), d);
  };
  const travel = (type, t) => type === 5 ? (t <= .62 ? t / .62 : 1 - (t - .62) / .38 * .78) : t;
  function frame(type, u, direction = 1) {
    const p = point(type, u), a = point(type, u - .0002), b = point(type, u + .0002);
    const tangent = b.sub(a).normalize().multiplyScalar(direction);
    const right = new T.Vector3().crossVectors(tangent, UP).normalize();
    return { p, tangent, right };
  }
  function canvasCell(im, col, row, cols, rows) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    c.getContext('2d').drawImage(im, im.naturalWidth / cols * col, im.naturalHeight / rows * row, im.naturalWidth / cols, im.naturalHeight / rows, 0, 0, 256, 256);
    return c;
  }
  let engine;
  class Engine {
    constructor(art) {
      this.art = art; this.cache = new Map(); this.textures = new Map();
      this.renderer = new T.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      this.renderer.setPixelRatio(1);const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),gpuName=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'';const software=/swiftshader|llvmpipe|software/i.test(gpuName);this.renderer.setSize(software?720:1100,software?432:660,false);
      this.renderer.setClearColor(0x000000, 0);const view=this.renderer.domElement;view.className='ride-webgl';view.style.cssText='position:absolute;z-index:1;pointer-events:none;display:none;background-size:cover;background-position:center';view.style.backgroundImage='url("'+art.panorama.src+'")';document.getElementById('game').parentElement.appendChild(view); this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.2;
      this.scene = new T.Scene(); this.scene.fog = new T.Fog(0xb9e6e9, 115, 300);
      this.scene.add(new T.HemisphereLight(0xeaffff, 0x547f69, 2.0));
      const sun = new T.DirectionalLight(0xfff0cd, 2.5); sun.position.set(-30, 80, 25); this.scene.add(sun);
      this.camera = new T.PerspectiveCamera(69, 5 / 3, .12, 420);
      this.camera.position.set(0, 0, 0); this.cameraInitialized = false;
    }
    texture(key, im, col, row, cols, rows, repeat = false) {
      if (this.textures.has(key)) return this.textures.get(key);
      const tex = new T.CanvasTexture(canvasCell(im, col, row, cols, rows)); tex.colorSpace = T.SRGBColorSpace;
      if (repeat) { tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy()); }
      this.textures.set(key, tex); return tex;
    }
    surface(type, radius, water = false, offset = 0) {
      const n = 340, m = water ? 4 : 18, positions = [], uv = [], indices = [], closed = type === 3;
      for (let i = 0; i <= n; i++) {
        const u = i / n, f = frame(type, u);
        for (let j = 0; j <= m; j++) {
          const v = j / m; let x, y;
          if (closed) { const a = water ? (v - .5) * .96 : (v - .5) * Math.PI * 2; x = radius * Math.sin(a); y = radius * (1 - Math.cos(a)) * .8; }
          else { x = (v - .5) * (water ? radius * 1.05 : radius * 2); y = Math.pow(Math.max(0, Math.abs(x) - radius * .55), 2) / (radius * .4); }
          const p = f.p.clone().addScaledVector(f.right, x + offset).addScaledVector(UP, y + (water ? .09 : 0));
          positions.push(p.x, p.y, p.z); uv.push(v * (water ? 1.4 : 1), u * LENGTH / (water ? 11 : 13));
          if (i < n && j < m) { const a = i * (m + 1) + j, b = a + m + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
        }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
    }
    build(type) {
      if (this.cache.has(type)) return this.cache.get(type);
      const group = new T.Group(), radius = type === 6 ? 8.4 : 7.1;
      const wallTile = type === 2 ? 1 : type === 3 ? 3 : type === 5 ? 4 : type === 4 ? 6 : type === 6 ? 1 : 2;
      const wallMap = this.texture('wall' + wallTile, this.art.materials, wallTile % 4, Math.floor(wallTile / 4), 4, 2, true);
      const railMap = this.texture('rail', this.art.materials, 1, 1, 4, 2, true);
      const waterMap = this.texture('water' + type, this.art.materials, 0, 0, 4, 2, true);
      const waterMat = new T.MeshStandardMaterial({ map: waterMap, color: 0x91f6ff, roughness: .23, metalness: .06, side: T.DoubleSide, transparent: true, opacity: .9, depthWrite: false });
      const walls = new T.MeshStandardMaterial({ map: wallMap, roughness: .31, metalness: .05, side: T.DoubleSide });
      const offsets = type === 4 ? [-15.2, 0, 15.2] : [0];
      offsets.forEach((offset, index) => {
        const material = type === 4 ? new T.MeshStandardMaterial({ map: this.texture('race' + index, this.art.materials, [2,2,3][index], [1,0,0][index], 4, 2, true), side: T.DoubleSide, roughness: .32 }) : walls;
        group.add(new T.Mesh(this.surface(type, radius, false, offset), material));
        const waterMesh=new T.Mesh(this.surface(type,radius,true,offset),waterMat);waterMesh.renderOrder=1;group.add(waterMesh);
        if (type !== 3) for (const side of [-1,1]) {
          const points = [];
          for (let i = 0; i <= 260; i++) { const f = frame(type, i / 260); points.push(f.p.clone().addScaledVector(f.right, side * radius + offset).addScaledVector(UP, radius * .506 + .10)); }
          const curve = new T.CatmullRomCurve3(points);
          group.add(new T.Mesh(new T.TubeGeometry(curve, 300, .19, 5, false), new T.MeshStandardMaterial({ map: railMap, color: 0xffefd0, roughness: .35 })));
        }
      });
      const seamMaterial = new T.LineBasicMaterial({ color: 0xfff8dd, transparent: true, opacity: .8 }),seamPoints=[],markerMatrices=[],ringMatrices=[];const markerDummy=new T.Object3D();
      for (let i = 0; i <= 44; i++) {
        const f = frame(type, i / 44), vertices = [];
        if (type === 3) {
          markerDummy.position.copy(f.p).addScaledVector(UP,radius*.8);markerDummy.rotation.set(0,Math.atan2(f.tangent.x,f.tangent.z),0);markerDummy.scale.set(1,.8,1);markerDummy.updateMatrix();ringMatrices.push(markerDummy.matrix.clone());
        } else {
          for (let j = 0; j <= 24; j++) { const x = (j / 24 - .5) * radius * 2, y = Math.pow(Math.max(0, Math.abs(x) - radius * .55), 2) / (radius * .4); const p = f.p.clone().addScaledVector(f.right, x).addScaledVector(UP, y + .025); vertices.push(p); }
          for(let j=1;j<vertices.length;j++)seamPoints.push(...vertices[j-1].toArray(),...vertices[j].toArray());
        }
        for (const sign of [-1,1]) {
          markerDummy.position.copy(f.p).addScaledVector(f.right,sign*(radius-.15)).addScaledVector(UP,type===3?radius*.8:radius*.506+.45);markerDummy.rotation.set(0,Math.atan2(f.tangent.x,f.tangent.z),0);markerDummy.scale.set(1,1,1);markerDummy.updateMatrix();markerMatrices.push({matrix:markerDummy.matrix.clone(),color:i%2?0xffd56d:0xffffff});
        }
      }
      if(seamPoints.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(seamPoints,3));group.add(new T.LineSegments(g,seamMaterial));}
      const markers=new T.InstancedMesh(new T.CylinderGeometry(.15,.15,.75,5),new T.MeshStandardMaterial({color:0xffffff,roughness:.4}),markerMatrices.length);markerMatrices.forEach((m,i)=>{markers.setMatrixAt(i,m.matrix);markers.setColorAt(i,new T.Color(m.color));});group.add(markers);
      if(ringMatrices.length){const rings=new T.InstancedMesh(new T.TorusGeometry(radius-.035,.10,5,28),new T.MeshStandardMaterial({color:0xb4ebff,emissive:0x123e51,roughness:.3}),ringMatrices.length);ringMatrices.forEach((m,i)=>rings.setMatrixAt(i,m));group.add(rings);}
      if (type === 2) {
        const pole = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 210, 16), new T.MeshStandardMaterial({ color: 0xb3cbd2, metalness: .5, roughness: .38 })); pole.position.set(38, 38, 0); group.add(pole);
        const cuffs=new T.InstancedMesh(new T.TorusGeometry(1.96,.16,5,16),new T.MeshStandardMaterial({color:0xe1e8eb,metalness:.4,roughness:.3}),10);let count=0;for(let y=-45;y<130;y+=18){markerDummy.position.set(38,y,0);markerDummy.rotation.set(Math.PI/2,0,0);markerDummy.scale.set(1,1,1);markerDummy.updateMatrix();cuffs.setMatrixAt(count++,markerDummy.matrix);}cuffs.count=count;group.add(cuffs);
      }
      const props = [];
      for (let i=0;i<8;i++) { const sprite = new T.Sprite(new T.SpriteMaterial({map:this.texture('prop'+(i%4),this.art.props,i%4,0,4,2),transparent:true,alphaTest:.025,depthWrite:false,toneMapped:false}));sprite.center.set(.5,.06);sprite.renderOrder=3;group.add(sprite);props.push(sprite); }
      const hero = new T.Sprite(new T.SpriteMaterial({transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false}));hero.center.set(.5,.10);hero.renderOrder=4;hero.scale.set(3.3,3.5,1);group.add(hero);
      const enemies=[];
      for(let i=0;i<3;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:this.texture('villain'+i,this.art.villains,i,0,3,1),transparent:true,alphaTest:.04,depthWrite:false,toneMapped:false}));sprite.center.set(.5,.08);sprite.renderOrder=4;sprite.scale.set(3.0,3.7,1);group.add(sprite);enemies.push(sprite);}
      const wake=new T.Mesh(new T.PlaneGeometry(4.6,5.5),new T.MeshBasicMaterial({map:this.texture('wake',this.art.water,0,0,4,2),transparent:true,opacity:.55,depthWrite:false,side:T.DoubleSide,toneMapped:false}));wake.renderOrder=2;group.add(wake);
      const item={group,type,radius,waterMap,props,hero,enemies,wake};group.visible=false;this.scene.add(group);this.cache.set(type,item);return item;
    }
    render(options) {
      const {type,progress,steer,hero,velocity,time,obstacles,checked,lastHit,bump,enemies}=options;
      const item=this.build(type);for(const cached of this.cache.values())cached.group.visible=cached===item;
      const u=travel(type,progress),direction=type===5&&progress>.62?-1:1,f=frame(type,u,direction);
      const target=f.p.clone().addScaledVector(f.right,steer*2).addScaledVector(UP,5.9).addScaledVector(f.tangent,-10.5);
      if(type===5&&progress>.57&&progress<.69){const q=(progress-.57)/.12,angle=Math.PI*q*q*(3-2*q),backward=new T.Vector3(Math.sin(angle),0,Math.cos(angle));target.copy(f.p).addScaledVector(f.right,steer*2).addScaledVector(UP,6.4).addScaledVector(backward,-10.5);}
      this.camera.position.copy(target);
      const ahead=point(type,travel(type,Math.min(1,progress+.035))).addScaledVector(f.right,steer*1.2).addScaledVector(UP,1.7);
      this.camera.up.set(-velocity*.035,1,0);this.camera.lookAt(ahead);
      item.waterMap.offset.y=-time*.13;
      const heroMap=this.texture('kid'+hero,this.art.heroes,hero,0,3,4);if(item.hero.material.map!==heroMap){item.hero.material.map=heroMap;item.hero.material.needsUpdate=true;}
      item.hero.position.copy(f.p).addScaledVector(f.right,steer*3.7).addScaledVector(UP,.20+Math.sin(time*4)*.025);
      item.hero.material.rotation=-velocity*.025;
      for(let i=0;i<obstacles.length;i++){
        const obstacle=obstacles[i],sprite=item.props[i],at=frame(type,travel(type,obstacle.at),type===5&&obstacle.at>.62?-1:1);
        sprite.visible=obstacle.at>=progress-.08&&obstacle.at<=progress+.48;
        const lane=obstacle.lane+Math.sin(progress*11+i*2)*.07;
        sprite.position.copy(at.p).addScaledVector(at.right,lane*3.7).addScaledVector(UP,.12+Math.sin(time*3+i)*.04);
        const hit=checked.includes(i)&&lastHit===obstacle.kind&&bump>0;
        sprite.material.map=this.texture('prop'+obstacle.kind+'hit'+(hit?1:0),this.art.props,obstacle.kind,hit?1:0,4,2);
        sprite.material.rotation=Math.sin(time*2+i)*.045;
        const dimensions=[[1.15,1.65],[1.35,1.15],[1.2,1.4],[1.35,1.35]][obstacle.kind];sprite.scale.set(dimensions[0],dimensions[1],1);
      }
      item.enemies.forEach((sprite,i)=>{const e=enemies[i];sprite.visible=!!e&&e.phase==='ride';if(!sprite.visible)return;const a=frame(type,travel(type,e.t));sprite.position.copy(a.p).addScaledVector(a.right,Math.sin(time*.6+i)*1.3).addScaledVector(UP,.2);});
      const back=frame(type,Math.max(0,u-.006),direction);item.wake.position.copy(back.p).addScaledVector(back.right,steer*3.7).addScaledVector(UP,.12);
      const normal=new T.Vector3().crossVectors(back.right,back.tangent).normalize();item.wake.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(back.right,back.tangent,normal));item.wake.material.opacity=.42+Math.sin(time*7)*.08;
      const view=this.renderer.domElement,rect=document.getElementById('game').parentElement.getBoundingClientRect(),width=Math.min(rect.width,rect.height*5/3),height=width*3/5;view.style.display='block';view.style.width=width+'px';view.style.height=height+'px';view.style.left=(rect.width-width)/2+'px';view.style.top=(rect.height-height)/2+'px';view.style.backgroundPosition=(50+Math.sin(u*10)*4)+'% center';this.renderer.render(this.scene,this.camera);
      const projected=item.hero.position.clone().project(this.camera);
      this.last={type,progress,u,camera:{x:target.x,y:target.y,z:target.z},hero:{x:(projected.x*.5+.5)*1200,y:(-.5*projected.y+.5)*720},heroFrame:0,props:item.props.map((sprite,i)=>{const p=sprite.position.clone().project(this.camera),v=sprite.position.clone().applyMatrix4(this.camera.matrixWorldInverse);return{kind:obstacles[i].kind,at:obstacles[i].at,x:(p.x*.5+.5)*1200,y:(-.5*p.y+.5)*720,height:v.z<0?sprite.scale.y*720/(2*Math.tan(this.camera.fov*Math.PI/360)*-v.z):0,visible:sprite.visible&&v.z<0};}),drawCalls:this.renderer.info.render.calls,webgl:true};
      return {canvas:this.renderer.domElement,dom:true,heroRendered:true,...this.last};
    }
  }
  class CanvasEngine {
    constructor(art){this.art=art;this.canvas=document.createElement('canvas');this.canvas.width=900;this.canvas.height=540;this.ctx=this.canvas.getContext('2d');this.camera=new T.PerspectiveCamera(69,5/3,.12,420);this.tiles=new Map();}
    tile(index){if(!this.tiles.has(index)){const image=canvasCell(this.art.materials,index%4,Math.floor(index/4),4,2);this.tiles.set(index,this.ctx.createPattern(image,'repeat'));}return this.tiles.get(index);}
    render(o){const {type,progress,steer,hero,time,obstacles}=o,u=travel(type,progress),direction=type===5&&progress>.62?-1:1,f=frame(type,u,direction),camera=f.p.clone().addScaledVector(f.right,steer*2).addScaledVector(UP,5.9).addScaledVector(f.tangent,-10.5);this.camera.position.copy(camera);this.camera.lookAt(point(type,travel(type,Math.min(1,progress+.035))).addScaledVector(UP,1.7));this.camera.updateMatrixWorld();const g=this.ctx;g.save();g.scale(.75,.75);g.drawImage(this.art.panorama,0,0,1200,720);
      const project=p=>{const v=p.clone().applyMatrix4(this.camera.matrixWorldInverse);if(v.z>-.3)return null;const q=p.clone().project(this.camera);return{x:(q.x*.5+.5)*1200,y:(-.5*q.y+.5)*720,z:-v.z};},radius=type===6?8.4:7.1,faces=[],tile=type===2?1:type===3?3:type===5?4:[1,4].includes(type)?2:1;
      const cross=(t,a)=>{const f=frame(type,t),x=type===3?radius*Math.sin(a*Math.PI):radius*a,y=type===3?radius*(1-Math.cos(a*Math.PI))*.8:Math.pow(Math.max(0,Math.abs(x)-radius*.55),2)/(radius*.4);return f.p.clone().addScaledVector(f.right,x).addScaledVector(UP,y);};
      for(let i=0;i<70;i++){const a=u+direction*(-.025+i*.0048),b=a+direction*.0048;if(a<0||a>1||b<0||b>1)continue;for(let j=0;j<10;j++){const l=-1+j*.2,r=l+.2,world=[cross(a,l),cross(b,l),cross(b,r),cross(a,r)],p=world.map(project);if(p.some(q=>!q))continue;faces.push({p,z:p.reduce((n,q)=>n+q.z,0)/4,water:Math.abs((l+r)/2)<.5});}}
      faces.sort((a,b)=>b.z-a.z);for(const face of faces){g.beginPath();face.p.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.fillStyle=this.tile(face.water?0:tile);g.fill();g.strokeStyle='#e8ffff22';g.lineWidth=1;g.stroke();}
      const snapshots=[];for(let i=obstacles.length-1;i>=0;i--){const obstacle=obstacles[i],f=frame(type,travel(type,obstacle.at),type===5&&obstacle.at>.62?-1:1),p=project(f.p.clone().addScaledVector(f.right,(obstacle.lane+Math.sin(progress*11+i*2)*.07)*3.7).addScaledVector(UP,.12));const visible=!!p&&obstacle.at>=progress-.08&&obstacle.at<=progress+.48;const h=p?Math.min(800,1.5*720/(2*Math.tan(69*Math.PI/360)*p.z)):0;snapshots[i]={kind:obstacle.kind,at:obstacle.at,x:p?.x||0,y:p?.y||0,height:h,visible};if(!visible)continue;const cw=this.art.props.naturalWidth/4,ch=this.art.props.naturalHeight/2;g.drawImage(this.art.props,cw*obstacle.kind,0,cw,ch,p.x-h*.45,p.y-h,h*.9,h);}
      const hp=project(f.p.clone().addScaledVector(f.right,steer*3.7).addScaledVector(UP,.2));if(hp){const h=Math.min(210,3.5*720/(2*Math.tan(69*Math.PI/360)*hp.z)),cw=this.art.heroes.naturalWidth/3,ch=this.art.heroes.naturalHeight/4;g.drawImage(this.art.heroes,cw*hero,0,cw,ch,hp.x-h*.47,hp.y-h*.9,h*.94,h);}
      g.restore();this.last={type,progress,u,camera:{x:camera.x,y:camera.y,z:camera.z},hero:hp||{x:600,y:600},heroFrame:0,props:snapshots,drawCalls:faces.length,webgl:false};return{canvas:this.canvas,dom:false,heroRendered:true,...this.last};}
  }
  window.Ride3D={
    render(options,art){if(!Object.values(art).every(im=>im.complete&&im.naturalWidth))return null;if(!engine){try{engine=new Engine(art);}catch(error){console.warn('Using software 3D:',error.message);engine=new CanvasEngine(art);}}try{return engine.render(options);}catch(error){if(engine instanceof CanvasEngine){console.warn('Ride render:',error.message);return null;}engine.renderer?.domElement.remove();engine=new CanvasEngine(art);return engine.render(options);}},
    snapshot(){return engine&&engine.last||null;},
    hide(){if(engine?.renderer)engine.renderer.domElement.style.display='none';},get available(){return !!engine;}
  };
})();
