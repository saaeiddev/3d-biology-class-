import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// These models are original, schematic geometry: organelle sizes and placement are illustrative.
export function makeScene(container, onSelect, options = {}) {
  let renderer;
  try { renderer = options.rendererFactory ? options.rendererFactory() : new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch {
    const diagrams = {
      neuron: `<path d="M75 120 C125 55 130 75 160 120 M78 200 C120 245 128 235 160 200 M100 55 L160 125 M100 260 L160 200 M70 150 L155 158" fill="none" stroke="#ca8061" stroke-width="7" stroke-linecap="round"/><circle cx="180" cy="160" r="42" fill="#d99270"/><circle cx="180" cy="160" r="18" fill="#9367a1"/><path d="M222 160 C320 145 400 180 525 160" fill="none" stroke="#d89063" stroke-width="9"/><g stroke="#efd1a6" stroke-width="22" stroke-linecap="round"><path d="M240 157 L285 156"/><path d="M310 158 L355 164"/><path d="M380 166 L425 166"/><path d="M450 165 L492 162"/></g><path d="M525 160 L567 125 M525 160 L573 160 M525 160 L567 195" fill="none" stroke="#d89063" stroke-width="7" stroke-linecap="round"/><g fill="#d89063"><circle cx="567" cy="125" r="7"/><circle cx="573" cy="160" r="7"/><circle cx="567" cy="195" r="7"/></g>`,
      plant: `<rect x="92" y="42" width="416" height="230" rx="18" fill="#a3db9d" stroke="#50a76d" stroke-width="12"/><rect x="111" y="61" width="378" height="192" rx="30" fill="#e2f6cf" stroke="#7fc897" stroke-width="4"/><ellipse cx="310" cy="160" rx="120" ry="68" fill="#a2dee0"/><circle cx="173" cy="108" r="32" fill="#a080c2"/><g fill="#46ad67"><ellipse cx="175" cy="211" rx="32" ry="14"/><ellipse cx="420" cy="105" rx="32" ry="14"/><ellipse cx="433" cy="214" rx="32" ry="14"/></g>`,
      bacteria: `<rect x="100" y="85" width="390" height="145" rx="72" fill="#9edcbb" stroke="#4caa78" stroke-width="8"/><path d="M210 170 C130 80 330 110 280 170 S420 215 370 130 S220 200 210 170" fill="none" stroke="#ad6fa8" stroke-width="7"/><path d="M485 160 C525 120 540 215 580 155" fill="none" stroke="#4caa78" stroke-width="6"/>`,
      animal: `<ellipse cx="300" cy="160" rx="200" ry="125" fill="#b8e7c5" stroke="#63b989" stroke-width="7"/><ellipse cx="260" cy="150" rx="68" ry="59" fill="#a989c8"/><circle cx="250" cy="144" r="19" fill="#765391"/><g fill="#e78f6b"><ellipse cx="395" cy="120" rx="34" ry="14"/><ellipse cx="200" cy="224" rx="34" ry="14"/><ellipse cx="383" cy="208" rx="34" ry="14"/></g><g fill="none" stroke="#e9b161" stroke-width="8"><path d="M310 208 Q345 180 380 195"/><path d="M310 220 Q345 192 380 207"/><path d="M310 232 Q345 204 380 219"/></g>`,
      dna: `<g fill="none" stroke-width="8"><path d="M245 30 C420 70 180 120 355 160 S180 250 355 290" stroke="#22a47c"/><path d="M355 30 C180 70 420 120 245 160 S420 250 245 290" stroke="#44b6ca"/></g><g stroke="#e6b65d" stroke-width="5"><path d="M260 55 L340 55 M282 95 L318 95 M280 135 L320 135 M260 185 L340 185 M275 225 L325 225 M285 265 L315 265"/></g>`
    };
    const fallback = { supported:false, show(type){const shape=diagrams[type] || diagrams.animal;container.innerHTML=`<div class="fallback-art"><svg viewBox="0 0 650 320" role="img" aria-label="Simplified 2D schematic">${shape}</svg><p>2D schematic · WebGL is unavailable in this browser. Select a structure to read its description.</p></div>`}, select(){}, reset(){}, setMotion(){}, setIsolated(){}, dispose(){container.innerHTML=''} };
    fallback.show('animal'); return fallback;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D model. Drag to rotate and use the mouse wheel to zoom.');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, .1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 1.6; controls.maxDistance = 22;
  scene.add(new THREE.HemisphereLight(0xe9fff5, 0x315741, 2.1));
  const key = new THREE.DirectionalLight(0xfff7df, 3.2); key.position.set(4, 7, 8); scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fffea, 2); fill.position.set(-6, 2, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.3); rim.position.set(0, -5, 4); scene.add(rim);
  const group = new THREE.Group(); scene.add(group);
  let targets = [], motion = !matchMedia('(prefers-reduced-motion: reduce)').matches, kind = 'animal';
  let selected = null, isolated = false, pulse = null, pulsePath = null, tickTime = 0, revision = 0, qualityModel = false;
  const modelPaths = {retinalNeuron:'eyewire-retinal-neuron.glb.gz',retina:'retina-cajal.glb.gz',purkinje:'purkinje-cajal.glb.gz',blood:'blood-cells.glb.gz',animal:'animal.glb.gz', plant:'plant.glb.gz', bacteria:'bacteria.glb.gz', neuron:'neuron.glb.gz'};
  const report = options.onStatus || (()=>{});
  const home = new THREE.Vector3(0, 1.6, 12.6), temp = new THREE.Vector3();
  const materials = (color, opts={}) => new THREE.MeshPhysicalMaterial({ color, roughness: .34, metalness: .02, clearcoat: .32, clearcoatRoughness: .27, ...opts });
  function add(geometry, color, name, position=[0,0,0], scale=[1,1,1], opts={}) {
    const mesh = new THREE.Mesh(geometry, materials(color, opts));
    mesh.position.set(...position); mesh.scale.set(...scale); mesh.userData.name = name || null;
    group.add(mesh); if (name) targets.push(mesh); return mesh;
  }
  function ball(name, color, pos, scale, opts={}) { return add(new THREE.SphereGeometry(1,32,22),color,name,pos,scale,opts); }
  function path(name, color, points, radius, opts={}) {
    const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return add(new THREE.TubeGeometry(curve,Math.max(28,points.length*9),radius,8,false),color,name,[0,0,0],[1,1,1],opts);
  }
  function segment(name, color, from, to, r1, r2=r1, opts={}) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), v = b.clone().sub(a);
    const obj = add(new THREE.CylinderGeometry(r2,r1,v.length(),12,1),color,name,a.clone().add(b).multiplyScalar(.5).toArray(),[1,1,1],opts);
    obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); return obj;
  }
  function shell(name, color, scale, opacity=.3) {
    // A partial shell exposes the interior rather than presenting opaque spheres.
    return add(new THREE.SphereGeometry(1,56,36,.26,Math.PI*1.72,.08,Math.PI-.16),color,name,[0,0,0],scale,{transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
  }
  function mitochondrion(p, factor=1, angle=0) {
    const m=ball('Mitochondrion',0xdc7555,p,[.48*factor,.24*factor,.22*factor]);m.rotation.z=angle;
    for(let j=0;j<5;j++){
      const x=(j-2)*.135*factor, dx=Math.cos(angle)*x,dy=Math.sin(angle)*x;
      const o=ball('Mitochondrion',0xffcf8a,[p[0]+dx,p[1]+dy,p[2]+.18*factor],[.04*factor,.13*factor,.025*factor]);o.rotation.z=angle;
    }
  }
  function chloroplast(p) {
    ball('Chloroplast',0x329b56,p,[.51,.27,.23]);
    for(let k=-2;k<=2;k++) ball('Chloroplast',0xc4e477,[p[0]+k*.14,p[1],p[2]+.19],[.038,.16,.025]);
  }
  function ribosomes(count=80) {
    for(let i=0;i<count;i++){
      const a=i*2.39996,r=.9+(i%9)*.13,x=Math.cos(a)*r,y=Math.sin(a)*r*.73,z=.52+(i%5)*.10;
      ball('Ribosomes',0xf2c66f,[x,y,z],[.045,.045,.045]);
    }
  }
  function nucleus(p=[-.45,.32,.1],size=.86) {
    ball('Nucleus',0x8966b1,p,[size,size*.88,size*.72]);
    ball('Nucleolus',0x513675,[p[0]-.12,p[1]+.06,p[2]+size*.57],[size*.26,size*.25,size*.14]);
    for(let i=0;i<22;i++) {const a=i*2.4; const r=size*(.52+(i%3)*.12);ball('Nucleus',0xd4b6e8,[p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r*.77,p[2]+size*.51],[.045,.045,.035]);}
  }
  function endomembranes() {
    for(let j=0;j<5;j++) {
      const y=-.65+j*.13;
      path('Golgi apparatus',0xedac56,[[.46,y,.64],[.76,y-.09,.7],[1.12,y-.08,.62],[1.42,y+.05,.5]],.062);
    }
    for(let j=0;j<5;j++){
      let pts=[];for(let i=0;i<17;i++){const a=(i/16)*Math.PI*1.25+.1;pts.push([-.45+Math.cos(a)*(1.00+j*.13),.32+Math.sin(a)*(.83+j*.10),.12+j*.07]);}
      path('Rough ER',0x76afd1,pts,.044);
      for(let i=1;i<pts.length;i+=3)ball('Rough ER',0xf6d78d,[pts[i][0],pts[i][1],pts[i][2]+.06],[.04,.04,.04]);
    }
    for(let i=0;i<10;i++){const a=i*2.4;ball('Vesicles',0xffc874,[1.1+Math.cos(a)*.4,-.35+Math.sin(a)*.37,.85],[.07,.07,.07]);}
  }
  function plant() {
    // Three translucent walls suggest the cut-away of a rectangular plant cell.
    const wall=(pos,scale)=>add(new THREE.BoxGeometry(1,1,1),0x5bad73,'Cell wall',pos,scale,{transparent:true,opacity:.43,depthWrite:false});
    wall([0,-1.75,0],[5.3,.12,2.55]);wall([-2.58,0,0],[.12,3.55,2.55]);wall([0,0,-1.24],[5.3,3.55,.12]);
    shell('Membrane',0x9bdca5,[2.55,1.72,1.18],.14);
    ball('Vacuole',0x8bd9dd,[.22,-.1,-.35],[1.6,1.2,.65],{transparent:true,opacity:.65,depthWrite:false});
    nucleus([-1.55,.72,.25],.58);
    for(const p of [[-1.8,-1,.3],[1.68,.95,.35],[1.8,-.9,.45],[-.2,1.23,.45]])chloroplast(p);
    mitochondrion([-1.05,-1,.55],.75,-.4);mitochondrion([1.15,-1.15,.55],.7,.4);
  }
  function animal(fungal=false) {
    shell('Membrane',fungal?0x9bd9a7:0x76c8a0,[2.58,2.03,1.48],.28);
    if(fungal)shell('Cell wall',0x5fac79,[2.7,2.15,1.58],.25);
    nucleus();endomembranes();
    for(const [p,a] of [[[1.55,.65,.44],.35],[[-1.52,-.95,.45],-.3],[[.3,1.48,.44],.65],[[1.1,-1.25,.45],-.4]])mitochondrion(p,.8,a);
    ribosomes(80);
    if(fungal)ball('Vacuole',0x7ad6d8,[.9,-.15,-.05],[.75,.7,.48],{transparent:true,opacity:.6,depthWrite:false});
    else {ball('Lysosome',0xecb763,[-1.55,.95,.55],[.21,.21,.2]);ball('Lysosome',0xecb763,[1.8,-.55,.35],[.17,.17,.17]);}
  }
  function bacteria() {
    shell('Cell wall',0x5ab57b,[2.8,1.35,1.2],.30);
    shell('Membrane',0xa6dbc0,[2.62,1.18,1.08],.22);
    const pts=[];for(let i=0;i<90;i++){let a=i*.48;pts.push([Math.cos(a)*(.65+(i%7)*.07),Math.sin(a)*.45,Math.sin(i*.9)*.24]);}path('Nucleoid',0x9e65af,pts,.045);
    ribosomes(100);
    path('Flagellum',0x338f6f,[[2.55,0,0],[3,.25,0],[3.5,-.3,0],[4,.3,0],[4.5,-.2,0],[5,0,0]],.045);
    for(let i=0;i<17;i++){const a=i*2.4,x=(i%8-3.5)*.55;segment('Pili',0x5f9f79,[x,Math.sin(a)*1.05,Math.cos(a)*.95],[x+.2,Math.sin(a)*1.65,Math.cos(a)*1.5],.025)}
  }
  function neuron() {
    // One representative multipolar neuron. Geometry is deliberately compressed to fit the view.
    ball('Cell body',0xd48a69,[-1.65,0,0],[.72,.72,.54]);
    ball('Nucleus',0x9367a1,[-1.65,0,.38],[.34,.33,.18]);
    ball('Nucleolus',0x674775,[-1.7,.04,.54],[.11,.11,.07]);
    const root=[-1.65,0,0];
    for(let b=0;b<11;b++){
      const a=(b/11)*Math.PI*2; if(Math.cos(a)>.76)continue;
      let p1=[root[0]+Math.cos(a)*.65,Math.sin(a)*.65,(b%3-1)*.13];
      let p2=[root[0]+Math.cos(a)*1.28,Math.sin(a)*1.22,(b%4-2)*.22];
      let p3=[root[0]+Math.cos(a)*1.85,Math.sin(a)*1.65,(b%3-1)*.38];
      segment('Dendrites',0xcf896a,root,p1,.16,.13);segment('Dendrites',0xcf896a,p1,p2,.13,.068);segment('Dendrites',0xcf896a,p2,p3,.068,.025);
      for(let side of [-1,1]){let end=[p2[0]+Math.cos(a+side*.55)*.75,p2[1]+Math.sin(a+side*.55)*.72,p2[2]+side*.25];segment('Dendrites',0xe3a27a,p2,end,.055,.015);}
    }
    const ax=[[-1.0,0,0],[-.35,-.06,0],[.35,-.13,0],[1.1,-.17,0],[1.8,-.12,0],[2.5,-.03,0],[3.1,.08,0]];
    pulsePath=new THREE.CatmullRomCurve3(ax.map(p=>new THREE.Vector3(...p)));
    path('Axon',0xdf9b6b,ax,.105);
    for(let i=0;i<5;i++){let t=.17+i*.135, pos=pulsePath.getPoint(t), next=pulsePath.getPoint(t+.105);segment('Myelin sheath',0xf2d2a8,pos.toArray(),next.toArray(),.23,.23,{roughness:.55});}
    for(let j=-2;j<=2;j++){
      let start=[3.03,.08,0], mid=[3.45,.08+j*.22,j*.08], end=[3.9,.08+j*.4,j*.13];
      segment('Axon terminals',0xdf9b6b,start,mid,.075,.045);segment('Axon terminals',0xdf9b6b,mid,end,.045,.025);ball('Axon terminals',0xf1a77a,end,[.10,.10,.10]);
    }
    pulse=ball(null,0xe8ff88,[-1,0,.15],[.15,.15,.15],{emissive:0xa8ff52,emissiveIntensity:1.3});
  }
  function dna(){
    let strandA=[],strandB=[];
    for(let i=0;i<30;i++){let y=(i-14.5)*.19,a=i*.46,p=[Math.cos(a)*1.15,y,Math.sin(a)*1.15],q=[-p[0],y,-p[2]];strandA.push(p);strandB.push(q);ball(null,0x19ab7e,p,[.12,.12,.12]);ball(null,0x46b5d2,q,[.12,.12,.12]);segment(null,i%2?0xe5a84b:0xd8798e,p,q,.045);}
    path(null,0x0b9872,strandA,.075);path(null,0x299dbb,strandB,.075);
  }
  function clear(){++revision;while(group.children.length){const c=group.children[0];group.remove(c);c.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mat of Array.isArray(o.material)?o.material:[o.material]){for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])mat[key]?.dispose();mat.dispose()}}})} targets=[];pulse=null;pulsePath=null;selected=null;isolated=false;qualityModel=false;group.rotation.set(0,0,0)}
  function reset(){camera.position.copy(home);controls.target.set(0,0,0);controls.update()}
  function show(type, mode='quality'){
    clear(); kind=type; home.set(0,1.6,12.6); reset();
    const modelName = modelPaths[type];
    if (modelName && mode==='quality' && (!options.rendererFactory || options.testAssetLoading)){
      qualityModel=true; const token=revision;
      if(type==='neuron'||type==='plant'){home.set(0,8.5,10.8);reset()}
      report('loading');
      const failed=()=>{if(token!==revision)return;qualityModel=false;report('error');if(type==='neuron')neuron();else if(type==='plant')plant();else if(type==='bacteria')bacteria();else if(!['blood','retina','purkinje','retinalNeuron'].includes(type))animal(false)};
      fetch(`${import.meta.env?.BASE_URL || '/'}models/${modelName}`).then(response=>{
        if(!response.ok)throw new Error('Model download failed');return response.arrayBuffer();
      }).then(async buffer=>{
        const bytes=new Uint8Array(buffer);
        if(bytes[0]===0x1f && bytes[1]===0x8b){
          if(typeof DecompressionStream==='undefined')throw new Error('Gzip decompression is not supported');
          buffer=await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        }
        if(token!==revision)return;
        new GLTFLoader().parse(buffer,'',gltf=>{
          if(token!==revision){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});return}
          const object=gltf.scene;const box=new THREE.Box3().setFromObject(object);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());
          const scale=5.6/Math.max(size.x,size.y,size.z);object.scale.setScalar(scale);object.position.copy(center).multiplyScalar(-scale);
          object.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});group.add(object);report('ready');
        },failed);
      }).catch(failed);
      return;
    }
    report('schematic');if(type==='dna')dna();else if(type==='neuron')neuron();else if(type==='plant')plant();else if(type==='bacteria')bacteria();else animal(type==='fungi');
  }
  function select(name){
    if(qualityModel)return;selected=name;group.rotation.y=0;
    targets.forEach(o=>{o.material.emissive?.setHex(o.userData.name===name?0x364327:0);o.visible=!isolated||o.userData.name===name});
    const first=targets.find(o=>o.userData.name===name);if(first){first.updateWorldMatrix(true,false);first.geometry.computeBoundingSphere();temp.copy(first.geometry.boundingSphere.center);first.localToWorld(temp);controls.target.copy(temp);const direction=camera.position.clone().sub(controls.target).normalize();camera.position.copy(controls.target).addScaledVector(direction,Math.max(5,Math.min(8,camera.position.distanceTo(controls.target))));controls.update()}
  }
  function setIsolated(value){if(qualityModel)return;isolated=value;targets.forEach(o=>{o.visible=!isolated||o.userData.name===selected});if(pulse)pulse.visible=!isolated}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;let r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets).find(x=>x.object.visible&&x.object.material.opacity>=.5);if(hit)onSelect(hit.object.userData.name)});
  const resize=new ResizeObserver(()=>{if(!container.clientWidth||!container.clientHeight)return;camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight)});resize.observe(container);
  let frame;const clock=new THREE.Clock();function tick(){frame=requestAnimationFrame(tick);const delta=Math.min(clock.getDelta(),.05);if(motion){tickTime+=delta;if(!selected&&kind!=='neuron')group.rotation.y+=delta*.12;if(pulse&&pulsePath){pulse.position.copy(pulsePath.getPoint((tickTime*.16)%1));pulse.position.z+=.17;}}controls.update();renderer.render(scene,camera)}tick();if(options.initial!==false)show('animal');
  return {supported:true,show,select,reset(){selected=null;setIsolated(false);targets.forEach(o=>o.material.emissive?.setHex(0));reset()},setMotion(v){motion=v},setIsolated,dispose(){cancelAnimationFrame(frame);resize.disconnect();controls.dispose();clear();renderer.dispose();renderer.domElement.remove()}};
}
