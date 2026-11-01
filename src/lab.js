import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export function createLab(host, onEnter, onStatus=()=>{}) {
 let renderer; try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); } catch {onStatus('unavailable');return {dispose(){}}}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xdcebe0);scene.fog=new THREE.Fog(0xdcebe0,13,31);
 const camera=new THREE.PerspectiveCamera(40,1,.1,60);camera.position.set(5,4.2,8.5);const target=new THREE.Vector3(0,2.15,0);camera.lookAt(target);
 scene.add(new THREE.HemisphereLight(0xecfff6,0x537363,2.2));const key=new THREE.DirectionalLight(0xfff3d4,3);key.position.set(-4,8,6);scene.add(key);
 const mat=(c,roughness=.72)=>new THREE.MeshStandardMaterial({color:c,roughness});
 const box=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);scene.add(m);return m};
 box(26,.15,22,0xc5d7c9,0,-.1,0);box(26,12,.2,0xddebe2,0,5,-5);box(.2,12,22,0xc9dfd1,-7,5,0);
 box(7,.22,3.2,0xe9eddf,0,1.52,0);box(6.7,1.35,2.9,0x82ac95,0,.75,0);for(let i=-1;i<=1;i++){box(1.9,.75,.06,0xa9c8b1,i*2.12,.95,1.47);box(.55,.045,.06,0x467d66,i*2.12,1.08,1.52)}
 box(4.8,2.65,.07,0xf5f6e9,-.4,4.7,-4.85);box(4.5,2.35,.06,0xa7d2cb,-.4,4.7,-4.79);box(.06,2.4,.08,0xf5f6e9,-.4,4.7,-4.74);box(4.5,.06,.08,0xf5f6e9,-.4,4.7,-4.74);
 // Architectural details are kept in the laboratory scene only.
 const steel=mat(0x82968e,.32), dark=mat(0x405b52,.55), glass=new THREE.MeshPhysicalMaterial({color:0xc6ebe0,roughness:.12,metalness:.05,transparent:true,opacity:.3,depthWrite:false});
 const piece=(geometry,material,x,y,z)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);scene.add(mesh);return mesh};
 // Fine seams and trim give the floor, walls and workbench a sense of scale.
 const grout=mat(0xaebfb2,.95);
 for(let x=-6;x<=6;x+=1.5)piece(new THREE.BoxGeometry(.012,.008,12),grout,x,-.017,1);
 for(let z=-4.5;z<=7;z+=1.5)piece(new THREE.BoxGeometry(14,.008,.012),grout,0,-.017,z);
 box(14,.15,.12,0xa7c1b0,0,.08,-4.78);box(.12,.15,12,0x9bb8a5,-6.86,.08,1);
 // Bench edge, kick plate, drawer divisions and brushed metal pulls.
 box(7,.09,.045,0xb5c6b7,0,1.43,1.61);box(6.65,.14,.06,0x537965,0,.12,1.46);
 for(let i=-1;i<=1;i++){
   box(1.9,.35,.065,0x98bba2,i*2.12,.39,1.48);
   piece(new THREE.BoxGeometry(.45,.035,.04),steel,i*2.12,.41,1.53);
   for(const dx of [-.2,.2])piece(new THREE.CylinderGeometry(.022,.022,.05,12),steel,i*2.12+dx,1.08,1.53).rotation.x=Math.PI/2;
 }
 // Rear counter and cupboards, kept behind the microscope and chemistry set.
 box(4.8,1.25,.85,0x91b4a0,-3.95,.66,-4.23);box(4.85,.12,.94,0xe8ece4,-3.95,1.34,-4.2);
 for(let i=0;i<3;i++){
   const x=-5.5+i*1.55;box(1.43,1.02,.045,0xb6d0bd,x,.72,-3.78);
   piece(new THREE.BoxGeometry(.38,.035,.04),steel,x,.92,-3.74);
 }
 // Wall storage with framed glazed doors and shelf contents.
 box(3.25,1.65,.35,0x9bbda8,-4.63,3.14,-4.58);
 box(3.08,1.5,.05,0xd7e7dc,-4.63,3.14,-4.36);
 for(const y of [2.65,3.2,3.69])box(3,.045,.27,0xf0f4eb,-4.63,y,-4.43);
 for(const x of [-6.15,-4.63,-3.1])box(.055,1.5,.06,0x8ba998,x,3.14,-4.3);
 for(const x of [-5.85,-5.4,-4.95,-4.25,-3.8,-3.4]){
   const bottle=piece(new THREE.CylinderGeometry(.11,.13,.35,16),mat(x<-4.6?0xd5e7da:0x8abeb1,.28),x,2.84,-4.38);
   piece(new THREE.CylinderGeometry(.055,.055,.075,12),dark,x,3.05,-4.38);
   piece(new THREE.BoxGeometry(.16,.1,.006),mat(0xf4f3dd),x,2.85,-4.245);
 }
 piece(new THREE.BoxGeometry(2.96,1.42,.015),glass,-4.63,3.14,-4.29);
 // Right-hand wall fixtures: backsplash, electrical outlets and a ventilation grille.
 box(3.3,1.08,.035,0xeaf2e8,3.55,2.12,-4.76);
 for(let x=2.05;x<=5.05;x+=.5)box(.009,1.03,.015,0xc4d6c8,x,2.12,-4.735);
 for(let y=1.62;y<=2.62;y+=.5)box(3.2,.009,.015,0xc4d6c8,3.55,y,-4.73);
 for(const x of [2.55,4.5]){box(.38,.25,.06,0xf8f8ee,x,2.02,-4.69);for(const dx of [-.07,.07])piece(new THREE.CylinderGeometry(.018,.018,.012,10),dark,x+dx,2.02,-4.65).rotation.x=Math.PI/2;}
 box(1.32,.5,.07,0xe8eee7,4.2,4.27,-4.72);
 for(let y=4.1;y<=4.44;y+=.065)box(1.14,.018,.02,0x94aa9d,4.2,y,-4.675);
 // Window framing and a soft outdoor view, with a sill and understated light fixture.
 for(const x of [-2.62,1.82])box(.09,2.48,.1,0xeaf4ec,x,4.7,-4.66);
 box(4.72,.12,.28,0xe8f2e7,-.4,3.44,-4.66);
 box(3.4,.08,.65,0xf4f6e9,.2,7.5,-1.8);box(3.05,.025,.45,0xfff9da,.2,7.44,-1.8);
 const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();let object=null,disposed=false,entering=false,frame=0,start=0;const begin=()=>{if(entering)return;entering=true;start=performance.now();onStatus('entering')};
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const down=e=>{if(!object)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);if(ray.intersectObject(object,true).length)begin()};renderer.domElement.addEventListener('click',down);
 onStatus('loading');new GLTFLoader().load(`${import.meta.env.BASE_URL}models/microscope.glb`,g=>{if(disposed)return;object=g.scene;const b=new THREE.Box3().setFromObject(object),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());const s=2.65/Math.max(size.x,size.y,size.z);object.scale.setScalar(s);object.position.set(-center.x*s,1.63-b.min.y*s,-center.z*s);scene.add(object);onStatus('ready')},undefined,()=>onStatus('error'));
 new GLTFLoader().load(`${import.meta.env.BASE_URL}models/chemistry-set.glb`,g=>{if(disposed)return;const kit=g.scene,b=new THREE.Box3().setFromObject(kit),z=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=1.8/Math.max(z.x,z.y,z.z);kit.scale.setScalar(scale);kit.position.set(-2.1-c.x*scale,1.64-b.min.y*scale,-.15-c.z*scale);scene.add(kit)},undefined,()=>{});
 const from=camera.position.clone(),toward=new THREE.Vector3(1.2,3,3.0);function loop(t){if(disposed)return;if(entering){let p=Math.min((t-start)/1150,1);p=p*p*(3-2*p);camera.position.lerpVectors(from,toward,p);camera.lookAt(0,2.5,0);if(p>=1){onEnter();return}}renderer.render(scene,camera);frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);
 return {enter:begin,dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();renderer.domElement.removeEventListener('click',down);scene.traverse(x=>{x.geometry?.dispose();if(x.material)for(const m of Array.isArray(x.material)?x.material:[x.material])m.dispose()});renderer.dispose();renderer.domElement.remove()}};
}

