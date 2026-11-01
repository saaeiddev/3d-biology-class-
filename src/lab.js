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
 const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();let object=null,disposed=false,entering=false,frame=0,start=0;const begin=()=>{if(entering)return;entering=true;start=performance.now();onStatus('entering')};
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const down=e=>{if(!object)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);if(ray.intersectObject(object,true).length)begin()};renderer.domElement.addEventListener('click',down);
 onStatus('loading');new GLTFLoader().load(`${import.meta.env.BASE_URL}models/microscope.glb`,g=>{if(disposed)return;object=g.scene;const b=new THREE.Box3().setFromObject(object),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3());const s=2.65/Math.max(size.x,size.y,size.z);object.scale.setScalar(s);object.position.set(-center.x*s,1.63-b.min.y*s,-center.z*s);scene.add(object);onStatus('ready')},undefined,()=>onStatus('error'));
 new GLTFLoader().load(`${import.meta.env.BASE_URL}models/chemistry-set.glb`,g=>{if(disposed)return;const kit=g.scene,b=new THREE.Box3().setFromObject(kit),z=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=1.8/Math.max(z.x,z.y,z.z);kit.scale.setScalar(scale);kit.position.set(-2.1-c.x*scale,1.64-b.min.y*scale,-.15-c.z*scale);scene.add(kit)},undefined,()=>{});
 const from=camera.position.clone(),toward=new THREE.Vector3(1.2,3,3.0);function loop(t){if(disposed)return;if(entering){let p=Math.min((t-start)/1150,1);p=p*p*(3-2*p);camera.position.lerpVectors(from,toward,p);camera.lookAt(0,2.5,0);if(p>=1){onEnter();return}}renderer.render(scene,camera);frame=requestAnimationFrame(loop)}frame=requestAnimationFrame(loop);
 return {enter:begin,dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();renderer.domElement.removeEventListener('click',down);scene.traverse(x=>{x.geometry?.dispose();if(x.material)for(const m of Array.isArray(x.material)?x.material:[x.material])m.dispose()});renderer.dispose();renderer.domElement.remove()}};
}
